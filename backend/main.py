"""
Cheap Gasoline API - FastAPI Backend
v1.0: Authentication, User Profiles, Roles
v1.5: Price History, Best Price Finder
"""

import json
import os
import math
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel, validator
from sqlmodel import Session, select, func, SQLModel

# Локальные импорты
from database import init_db, get_session
from models import (
    User, UserProfile, Station, PriceUpdate, 
    ContributionHistory, PriceConfirmation, FlaggedPrice,
    RolePermission, AuditLog, PriceHistory, Achievement, UserAchievement,
    UserStation
)
from auth import (
    get_current_user, require_permission_dependency,
    rate_limiter, security, require_admin
)


# ============ ИНИЦИАЛИЗАЦИЯ ============

# Создание папок
os.makedirs("uploads", exist_ok=True)
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")

# FastAPI app
app = FastAPI(
    title="Cheap Gasoline API",
    version="1.5",
    description="Сервис мониторинга цен на топливо"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Production
        "https://cheap-gasoline-alexproject.vercel.app",
        "https://cheap-gasoline.vercel.app",
        # Local development
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5180",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5180",
        "http://192.168.1.31:3000",
        "http://192.168.1.31:5173",
        "http://192.168.1.31:5174",
        "http://192.168.1.31:5175",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Add COOP header middleware
class COOPMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
        response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
        return response

app.add_middleware(COOPMiddleware)

# DB init
try:
    init_db()
    print("✅ Database initialized")
except Exception as e:
    print(f"⚠️ Database init: {e}")


# ============ PYDANTIC SCHEMAS ============

class UserRegisterRequest(BaseModel):
    """Запрос на регистрацию"""
    email: str
    password: str
    name: Optional[str] = None
    
    @validator('email')
    def validate_email(cls, v):
        if '@' not in v:
            raise ValueError('Invalid email')
        return v.lower()
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password min 6 chars')
        return v


class UserLoginRequest(BaseModel):
    """Запрос на вход"""
    email: str
    password: str


class PriceUpdateRequest(BaseModel):
    """Обновление цены"""
    station_id: int
    fuel_type: str
    price: float
    
    @validator('fuel_type')
    def validate_fuel_type(cls, v):
        allowed = ['92', '95', '98', 'diesel', 'lpg']
        if v not in allowed:
            raise ValueError(f'Fuel type one of {allowed}')
        return v
    
    @validator('price')
    def validate_price(cls, v):
        if v <= 0 or v > 300:
            raise ValueError('Price 0-300')
        return v


class LocationRequest(BaseModel):
    """Поиск по координатам"""
    latitude: float
    longitude: float
    radius_km: int = 5
    
    @validator('latitude')
    def validate_lat(cls, v):
        if not -90 <= v <= 90:
            raise ValueError('Invalid lat')
        return v
    
    @validator('longitude')
    def validate_lng(cls, v):
        if not -180 <= v <= 180:
            raise ValueError('Invalid lng')
        return v


# ============ UTILITY ============

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Расстояние между точками (км)"""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c


def log_audit(db: Session, user_id: Optional[int], action: str, 
              target_id: Optional[int] = None, details: Optional[Dict] = None,
              ip_address: Optional[str] = None):
    """Логирование"""
    audit = AuditLog(
        user_id=user_id,
        action=action,
        target_id=target_id,
        details=json.dumps(details) if details else None,
        ip_address=ip_address
    )
    db.add(audit)


# ============ HEALTH CHECK ============

@app.get("/health")
def health_check():
    return {"status": "healthy"}


# ============ DEV: CREATE TEST USER ============

@app.post("/api/dev/create-test-user")
def create_test_user(db: Session = Depends(get_session)):
    """
    ТОЛЬКО для локальной разработки: создать тестового пользователя
    Email: test@test.com
    Password: test123456
    """
    # Проверяем, есть ли уже тестовый пользователь
    existing = db.exec(select(User).where(User.email == "test@test.com")).first()
    if existing:
        return {"status": "info", "message": "Тестовый пользователь уже существует"}
    
    # Создаем тестового пользователя
    test_user = User(
        email="test@test.com",
        name="Test User",
        role="user",
        is_active=True,
        karma_points=50,
        verification_score=75.0
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    
    # Создаем профиль
    profile = UserProfile(
        user_id=test_user.id,
        notifications_enabled=True
    )
    db.add(profile)
    db.commit()
    
    return {
        "status": "success",
        "message": "Тестовый пользователь создан",
        "email": "test@test.com",
        "password": "test123456"
    }


# ============ AUTHENTICATION (Firebase) ============

@app.post("/api/auth/create-user")
def create_user_after_firebase(
    email: str,
    name: Optional[str] = None,
    db: Session = Depends(get_session)
):
    """
    Создать пользователя в локальной БД после Firebase-регистрации
    
    Accepts:
    - Query params: email, name (optional)
    - JSON body: {"email": "...", "name": "..."}
    """
    try:
        # Normalize email
        email = email.lower().strip() if email else None
        
        if not email or '@' not in email:
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Check if user already exists
        existing = db.exec(
            select(User).where(User.email == email)
        ).first()
        
        if existing:
            return {
                "status": "exists",
                "message": "User already exists",
                "user_id": existing.id
            }
        
        # Create new user with proper defaults
        user = User(
            email=email,
            name=name.strip() if name else email.split('@')[0],
            role="user",  # Default role
            is_banned=False,
            karma_points=0,
            verification_score=0.0,
            total_updates=0,
            confirmed_updates=0,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create user profile
        profile = UserProfile(
            user_id=user.id,
            notifications_enabled=True,
            notification_radius_km=5
        )
        db.add(profile)
        
        # Log action
        log_audit(db, user.id, "user_created_via_firebase", details={"email": email})
        db.commit()
        
        return {
            "status": "success",
            "message": "User created successfully",
            "user_id": user.id,
            "email": email
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")


# ============ USER PROFILE ============

@app.get("/api/user/profile")
def get_user_profile(current_user: Dict = Depends(get_current_user),
                     db: Session = Depends(get_session)):
    """Профиль пользователя"""
    user = db.get(User, current_user["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="Not found")
    
    profile = db.exec(select(UserProfile).where(UserProfile.user_id == user.id)).first()
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "avatar": user.avatar,
        "role": user.role,
        "karma_points": user.karma_points,
        "verification_score": user.verification_score,
        "total_updates": user.total_updates,
        "confirmed_updates": user.confirmed_updates,
        "created_at": user.created_at,
        "profile": {
            "favorite_fuel_types": json.loads(profile.favorite_fuel_types) if profile else [],
            "favorite_station_ids": json.loads(profile.favorite_station_ids) if profile else [],
            "notification_radius_km": profile.notification_radius_km if profile else 5,
        }
    }


@app.get("/api/user/contributions")
def get_contributions(current_user: Dict = Depends(get_current_user),
                     skip: int = 0, limit: int = 20,
                     db: Session = Depends(get_session)):
    """История вкладов"""
    contributions = db.exec(
        select(ContributionHistory)
        .where(ContributionHistory.user_id == current_user["user_id"])
        .order_by(ContributionHistory.created_at.desc())
        .offset(skip).limit(limit)
    ).all()
    
    result = []
    for c in contributions:
        station = db.get(Station, c.station_id)
        result.append({
            "id": c.id,
            "station_id": c.station_id,
            "station_name": station.name if station else "?",
            "fuel_type": c.fuel_type,
            "old_price": c.old_price,
            "new_price": c.new_price,
            "status": c.status,
            "confirmations": c.confirmation_count,
            "created_at": c.created_at
        })
    
    return result


# ============ PRICES ============

@app.post("/api/price/update")
def update_price(data: PriceUpdateRequest,
                current_user: Dict = Depends(get_current_user),
                request: Request = None,
                db: Session = Depends(get_session)):
    """Обновить цену"""
    
    is_allowed = rate_limiter.is_allowed(
        f"price:{current_user['user_id']}",
        max_requests=10, window_seconds=60
    )
    if not is_allowed:
        raise HTTPException(status_code=429, detail="Too many updates")
    
    station = db.get(Station, data.station_id)
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    
    last_price = db.exec(
        select(PriceUpdate)
        .where(PriceUpdate.station_id == data.station_id,
               PriceUpdate.fuel_type == data.fuel_type)
        .order_by(PriceUpdate.created_at.desc())
    ).first()
    
    old_price = last_price.price if last_price else None
    
    price_update = PriceUpdate(
        station_id=data.station_id,
        fuel_type=data.fuel_type,
        price=data.price,
        source="user"
    )
    db.add(price_update)
    db.commit()
    db.refresh(price_update)
    
    contribution = ContributionHistory(
        user_id=current_user["user_id"],
        station_id=data.station_id,
        fuel_type=data.fuel_type,
        old_price=old_price,
        new_price=data.price,
        status="pending"
    )
    db.add(contribution)
    
    user = db.get(User, current_user["user_id"])
    user.total_updates += 1
    db.add(user)
    
    log_audit(db, current_user["user_id"], "price_updated",
              target_id=price_update.id,
              details={"station": data.station_id, "fuel": data.fuel_type},
              ip_address=request.client.host if request else None)
    
    db.commit()
    
    return {"id": price_update.id, "status": "created"}


# ============ BEST PRICE v1.5 ============

@app.post("/api/station/best-price")
def find_best_price(location: LocationRequest, fuel_type: str = "95",
                   db: Session = Depends(get_session)):
    """Найти дешевую заправку"""
    
    lat_delta = location.radius_km / 110.0
    lng_delta = location.radius_km / (110.0 * math.cos(math.radians(location.latitude)))
    
    nearby = db.exec(
        select(Station).where(
            Station.lat.between(location.latitude - lat_delta, location.latitude + lat_delta),
            Station.lng.between(location.longitude - lng_delta, location.longitude + lng_delta)
        )
    ).all()
    
    valid = []
    for station in nearby:
        dist = haversine_distance(location.latitude, location.longitude, 
                                 station.lat, station.lng)
        if dist <= location.radius_km:
            last = db.exec(
                select(PriceUpdate)
                .where(PriceUpdate.station_id == station.id,
                       PriceUpdate.fuel_type == fuel_type)
                .order_by(PriceUpdate.created_at.desc())
            ).first()
            
            if last and (datetime.utcnow() - last.created_at).total_seconds() < 7200:
                valid.append({"station": station, "price": last.price, "distance": dist})
    
    valid.sort(key=lambda x: x["price"])
    
    return {
        "fuel_type": fuel_type,
        "best_station": {
            "id": valid[0]["station"].id,
            "name": valid[0]["station"].name,
            "price": round(float(valid[0]["price"]), 2),
            "distance_km": round(valid[0]["distance"], 1),
            "crown": "👑"
        } if valid else None,
        "nearby": [{
            "id": s["station"].id,
            "name": s["station"].name,
            "price": round(float(s["price"]), 2),
            "distance_km": round(s["distance"], 1)
        } for s in valid[:5]]
    }


# ============ PRICE HISTORY v1.5 ============

@app.get("/api/station/{station_id}/price-history/{fuel_type}")
def get_price_history(station_id: int, fuel_type: str, days: int = 30,
                     db: Session = Depends(get_session)):
    """График цены"""
    
    history = db.exec(
        select(PriceHistory)
        .where(PriceHistory.station_id == station_id,
               PriceHistory.fuel_type == fuel_type)
        .order_by(PriceHistory.date)
    ).all()
    
    return {
        "station_id": station_id,
        "fuel_type": fuel_type,
        "dates": [h.date for h in history],
        "avg": [round(h.avg_price, 2) for h in history],
        "min": [round(h.min_price, 2) for h in history],
        "max": [round(h.max_price, 2) for h in history]
    }


# ============ ADMIN ============

@app.get("/api/admin/moderation/recent")
def get_moderation(current_user: Dict = Depends(get_current_user),
                  limit: int = 50, db: Session = Depends(get_session)):
    """Список для модерации"""
    
    # Проверяем, что это MODERATOR или выше
    if current_user["role"] not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Только модераторы")
    
    contribs = db.exec(
        select(ContributionHistory)
        .where(ContributionHistory.status == "pending")
        .order_by(ContributionHistory.created_at.desc())
        .limit(limit)
    ).all()
    
    result = []
    for item in contribs:
        flags = []
        if item.new_price < 10:
            flags.append("impossibly_low")
        
        user = db.get(User, item.user_id)
        result.append({
            "id": item.id,
            "user_id": item.user_id,
            "user_karma": user.karma_points if user else 0,
            "station_id": item.station_id,
            "fuel_type": item.fuel_type,
            "price": item.new_price,
            "flags": flags,
            "timestamp": item.created_at
        })
    
    return result


@app.on_event("startup")
async def startup():
    """Инициализация"""
    try:
        init_db()
        print("✅ DB OK")
    except Exception as e:
        print(f"⚠️ DB: {e}")


@app.get("/api/stations")
def get_stations(db: Session = Depends(get_session)):
    """Все АЗС с ценами"""
    stations = db.exec(select(Station)).all()
    result = []
    for station in stations:
        prices_data = []
        if station.fuel_config:
            fuel_list = json.loads(station.fuel_config)
            for fuel in fuel_list:
                last_price = db.exec(select(PriceUpdate).where(
                    PriceUpdate.station_id == station.id,
                    PriceUpdate.fuel_type == fuel.get('id')
                ).order_by(PriceUpdate.created_at.desc())).first()
                prices_data.append({
                    "id": fuel.get('id'),
                    "type": fuel.get('label'),
                    "price": float(last_price.price) if last_price else None
                })
        result.append({
            "id": station.id, "name": station.name, "brand": station.brand,
            "lat": station.lat, "lng": station.lng, "prices": prices_data
        })
    return result


# ==================== RBAC API ENDPOINTS ====================

# СТРУКТУРЫ ДЛЯ УПРАВЛЕНИЯ РОЛЯМИ
class UserRoleUpdate(SQLModel):
    user_id: int
    new_role: str
    reason: Optional[str] = None


class UserStationAssignment(SQLModel):
    user_id: int
    station_id: int
    role_at_station: str = "operator"


class UserListItem(SQLModel):
    user_id: int
    email: str
    role: str
    is_banned: bool
    managed_stations_count: int


# 1️⃣ СОЗДАТЬ ПЕРВОГО АДМИНА (ОСОБЫЙ СЛУЧАЙ - когда админов еще нет)
@app.post("/api/admin/create-initial-admin")
def create_initial_admin(
    email: str,
    password: str,
    db: Session = Depends(get_session)
) -> Dict[str, str]:
    """
    Создать первого администратора.
    ТОЛЬКО если в базе нет ни одного админа (безопасность).
    """
    # Проверяем, существует ли хуть один админ
    stmt = select(User).where(User.role == "admin").limit(1)
    existing_admin = db.exec(stmt).first()
    
    if existing_admin:
        raise HTTPException(status_code=403, detail="Администраторы уже существуют в системе")
    
    # Проверяем, не существует ли уже пользователь с этим email
    stmt = select(User).where(User.email == email.lower())
    if db.exec(stmt).first():
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")
    
    # Создаем админа
    new_admin = User(
        email=email.lower(),
        role="admin",
        is_active=True,
        karma_points=100,
        verification_score=100
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    
    # Логируем в AuditLog
    audit = AuditLog(
        user_id=new_admin.id,
        action="CREATE_INITIAL_ADMIN",
        details={"email": email},
        ip_address="system"
    )
    db.add(audit)
    db.commit()
    
    return {"status": "success", "message": "Администратор создан", "admin_id": new_admin.id}


# 2️⃣ ИЗМЕНИТЬ РОЛЬ ПОЛЬЗОВАТЕЛЯ (ТОЛЬКО ADMIN)
@app.post("/api/admin/change-user-role")
def change_user_role(
    update: UserRoleUpdate,
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_session)
) -> Dict[str, str]:
    """
    Изменить роль пользователя.
    Допустимые роли: admin, station_owner, moderator, user, guest
    """
    # Проверяем, что текущий пользователь - ADMIN
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Только администраторы могут менять роли")
    
    # Находим пользователя
    stmt = select(User).where(User.id == update.user_id)
    user_to_update = db.exec(stmt).first()
    
    if not user_to_update:
        raise HTTPException(status_code=404, detail=f"Пользователь {update.user_id} не найден")
    
    # Проверяем валидность новой роли
    valid_roles = {"admin", "station_owner", "moderator", "user", "guest"}
    if update.new_role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Недопустимая роль: {update.new_role}")
    
    # Обновляем роль
    old_role = user_to_update.role
    user_to_update.role = update.new_role
    db.add(user_to_update)
    db.commit()
    db.refresh(user_to_update)
    
    # Логируем
    audit = AuditLog(
        user_id=current_user["user_id"],
        action="CHANGE_USER_ROLE",
        details={
            "target_user_id": update.user_id,
            "old_role": old_role,
            "new_role": update.new_role,
            "reason": update.reason
        },
        ip_address="api"
    )
    db.add(audit)
    db.commit()
    
    return {"status": "success", "message": f"Роль изменена на {update.new_role}"}


# 3️⃣ ВЫДАТЬ ПОЛЬЗОВАТЕЛЮ ДОСТУП К СТАНЦИИ (ТОЛЬКО ADMIN)
@app.post("/api/admin/assign-user-to-station")
def assign_user_to_station(
    assignment: UserStationAssignment,
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_session)
) -> Dict[str, str]:
    """
    Назначить пользователя на станцию.
    Используется для привязки STATION_OWNER к конкретной станции.
    """
    # Проверяем права (только ADMIN)
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Только администраторы")
    
    # Проверяем существование пользователя
    stmt = select(User).where(User.id == assignment.user_id)
    user_obj = db.exec(stmt).first()
    if not user_obj:
        raise HTTPException(status_code=404, detail=f"Пользователь {assignment.user_id} не найден")
    
    # Проверяем существование станции
    stmt = select(Station).where(Station.id == assignment.station_id)
    station_obj = db.exec(stmt).first()
    if not station_obj:
        raise HTTPException(status_code=404, detail=f"Станция {assignment.station_id} не найдена")
    
    # Проверяем, нет ли уже связи
    stmt = select(UserStation).where(
        UserStation.user_id == assignment.user_id,
        UserStation.station_id == assignment.station_id
    )
    existing = db.exec(stmt).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь уже привязан к этой станции")
    
    # Создаем связь
    user_station = UserStation(
        user_id=assignment.user_id,
        station_id=assignment.station_id,
        role_at_station=assignment.role_at_station,
        assigned_at=datetime.utcnow()
    )
    db.add(user_station)
    db.commit()
    db.refresh(user_station)
    
    # Логируем
    audit = AuditLog(
        user_id=current_user["user_id"],
        action="ASSIGN_USER_TO_STATION",
        details={
            "user_id": assignment.user_id,
            "station_id": assignment.station_id,
            "role": assignment.role_at_station
        },
        ip_address="api"
    )
    db.add(audit)
    db.commit()
    
    return {"status": "success", "message": f"Пользователь назначен на станцию"}


# 4️⃣ ПОЛУЧИТЬ СПИСОК ВСЕХ ПОЛЬЗОВАТЕЛЕЙ (ТОЛЬКО ADMIN)
@app.get("/api/admin/users", response_model=List[Dict])
def get_all_users(
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_session)
) -> List[Dict]:
    """
    Получить список всех пользователей для админ-панели.
    """
    # Проверяем, что текущий пользователь - ADMIN
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Только администраторы")
    
    # Получаем всех пользователей
    stmt = select(User)
    users = db.exec(stmt).all()
    
    result = []
    for user in users:
        # Считаем cantidad станций
        stmt = select(func.count(UserStation.id)).where(UserStation.user_id == user.id)
        managed_count = db.exec(stmt).scalar() or 0
        
        result.append({
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "is_banned": user.is_banned,
            "ban_reason": user.ban_reason or "—",
            "karma_points": user.karma_points,
            "is_active": user.is_active,
            "managed_stations_count": managed_count,
            "created_at": user.created_at.isoformat() if user.created_at else None
        })
    
    return result


# 5️⃣ ПОЛУЧИТЬ СТАНЦИИ, УПРАВЛЯЕМЫЕ СТАНЦИЙ_ОВНЕРУ (ДЛЯ STATION_OWNER)
@app.get("/api/user/managed-stations")
def get_managed_stations(
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_session)
) -> List[Dict]:
    """
    Получить список станций, которыми управляет текущий пользователь.
    Работает для: ADMIN (видит все станции), STATION_OWNER (видит свои), MODERATOR (видит все).
    """
    if current_user["role"] == "admin" or current_user["role"] == "moderator":
        # ADMIN и MODERATOR видят все станции
        stmt = select(Station)
    else:
        # STATION_OWNER видит только свои станции через UserStation
        stmt = (
            select(Station)
            .join(UserStation)
            .where(UserStation.user_id == current_user["user_id"])
        )
    
    stations = db.exec(stmt).all()
    
    result = []
    for station in stations:
        # Получаем последние цены
        stmt = select(PriceUpdate).where(PriceUpdate.station_id == station.id).order_by(PriceUpdate.updated_at.desc()).limit(1)
        latest_update = db.exec(stmt).first()
        
        result.append({
            "id": station.id,
            "name": station.name,
            "brand": station.brand,
            "lat": station.lat,
            "lng": station.lng,
            "is_verified": station.is_verified,
            "last_update": latest_update.updated_at.isoformat() if latest_update else None,
            "owner_company": station.owner_company or "—"
        })
    
    return result


# 6️⃣ ЗАБЛОКИРОВАТЬ/РАЗБЛОКИРОВАТЬ ПОЛЬЗОВАТЕЛЯ (ТОЛЬКО ADMIN)
@app.post("/api/admin/ban-user/{user_id}")
def ban_user(
    user_id: int,
    ban_reason: Optional[str] = None,
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_session)
) -> Dict[str, str]:
    """
    Заблокировать пользователя (запретить обновление цен).
    """
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Только администраторы")
    
    stmt = select(User).where(User.id == user_id)
    user_obj = db.exec(stmt).first()
    
    if not user_obj:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    user_obj.is_banned = True
    user_obj.ban_reason = ban_reason or "Блокада администратором"
    db.add(user_obj)
    db.commit()
    
    # Логируем
    audit = AuditLog(
        user_id=current_user["user_id"],
        action="BAN_USER",
        details={"target_user_id": user_id, "reason": ban_reason},
        ip_address="api"
    )
    db.add(audit)
    db.commit()
    
    return {"status": "success", "message": f"Пользователь заблокирован"}


# ============ ROLE MANAGEMENT ENDPOINTS ============

@app.post("/api/admin/set-user-role")
async def set_user_role_endpoint(
    firebase_uid: str,
    role: str,
    current_user: Dict = Depends(require_admin)
):
    """
    Установить роль пользователю через Firebase Custom Claims
    Только для админов
    """
    from auth import set_user_role
    return await set_user_role(firebase_uid, role, current_user)


@app.get("/api/admin/user-role/{firebase_uid}")
async def get_user_role_endpoint(
    firebase_uid: str,
    current_user: Dict = Depends(require_admin)
):
    """
    Получить роль пользователя из Firebase Custom Claims
    Только для админов
    """
    from auth import get_user_role
    return await get_user_role(firebase_uid, current_user)


@app.get("/api/admin/users-with-roles")
async def list_users_with_roles_endpoint(
    current_user: Dict = Depends(require_admin)
):
    """
    Получить список всех пользователей с их ролями из Firebase
    Только для админов
    """
    from auth import list_users_with_roles
    return await list_users_with_roles(current_user)


@app.post("/api/admin/create-admin")
async def create_admin_endpoint(
    email: str,
    current_user: Dict = Depends(require_admin)
):
    """
    Создать нового админа (установить роль admin)
    Сначала нужно создать пользователя в Firebase Console
    """
    try:
        # Найти пользователя по email
        from firebase_admin import auth
        user = auth.get_user_by_email(email)
        firebase_uid = user.uid

        # Установить роль admin
        from auth import set_user_role
        result = await set_user_role(firebase_uid, "admin", current_user)

        return {
            "message": f"Пользователь {email} назначен админом",
            "firebase_uid": firebase_uid
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Не удалось создать админа: {str(e)}")


@app.get("/")
def read_root():
    return {"status": "online", "message": "Gasoline API v1.5 (с Firebase RBAC)"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
