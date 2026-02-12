import json
import datetime
import os
from fastapi import FastAPI, Depends, HTTPException, Request, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import FileResponse
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import auth_utils

# --- НАСТРОЙКИ БАЗ (ОТДЕЛЬНЫЕ ФАЙЛЫ) ---
# Каждая БД в отдельном файле для изоляции данных
USERS_DB_URL = "sqlite:///./data/users.db"
STATIONS_DB_URL = "sqlite:///./data/stations.db"
PRICES_DB_URL = "sqlite:///./data/prices.db"
SITEINFO_DB_URL = "sqlite:///./data/site_info.db"

# Создание папки data если её нет
os.makedirs("data", exist_ok=True)

# --- USERS DATABASE ---
users_engine = create_engine(USERS_DB_URL, connect_args={"check_same_thread": False})
UsersSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=users_engine)
UsersBase = declarative_base()

class User(UsersBase):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String, nullable=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)
    role = Column(String, default="user")  # user, moderator, admin, superadmin
    avatar_url = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

UsersBase.metadata.create_all(bind=users_engine)

# --- STATIONS DATABASE ---
stations_engine = create_engine(STATIONS_DB_URL, connect_args={"check_same_thread": False})
StationsSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=stations_engine)
StationsBase = declarative_base()

class Station(StationsBase):
    __tablename__ = "station"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    brand = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    fuel_config = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

StationsBase.metadata.create_all(bind=stations_engine)

# --- PRICES DATABASE ---
prices_engine = create_engine(PRICES_DB_URL, connect_args={"check_same_thread": False})
PricesSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=prices_engine)
PricesBase = declarative_base()

class PriceUpdate(PricesBase):
    __tablename__ = "priceupdate"
    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, index=True)
    user_id = Column(Integer, nullable=True)
    fuel_type = Column(String)
    price = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    source = Column(String, default="manual_update")

PricesBase.metadata.create_all(bind=prices_engine)

# --- SITE INFO DATABASE ---
siteinfo_engine = create_engine(SITEINFO_DB_URL, connect_args={"check_same_thread": False})
SiteInfoSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=siteinfo_engine)
SiteInfoBase = declarative_base()

class SiteInfo(SiteInfoBase):
    __tablename__ = "site_info"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(String)
    description = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class AuditLog(SiteInfoBase):
    __tablename__ = "audit_log"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    action = Column(String)  # login, logout, user_created, role_changed, delete_user, etc.
    target_user_id = Column(Integer, nullable=True)
    details = Column(String, nullable=True)  # JSON details
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

SiteInfoBase.metadata.create_all(bind=siteinfo_engine)

# --- OAUTH2 SCHEME ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Получить текущего пользователя из JWT токена"""
    try:
        payload = auth_utils.decode_access_token(token)
        user_id = int(payload.get('sub'))
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')
    db = UsersSessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found')
        return user
    finally:
        db.close()
def sync_db_fuel_configs():
    db = StationsSessionLocal()
    configs = {
        "SOCAR": [{"id": "n95", "label": "NANO 95"}, {"id": "n92", "label": "NANO 92"}, {"id": "diesel", "label": "NANO DT"}, {"id": "lpg", "label": "LPG"}],
        "GULF": [{"id": "g98", "label": "G-Force 98"}, {"id": "g95", "label": "G-Force 95"}, {"id": "reg", "label": "Euro Reg"}, {"id": "diesel", "label": "G-Force D"}],
        "WISSOL": [{"id": "eko_super", "label": "EKO SUPER"}, {"id": "eko_premium", "label": "EKO PREMIUM"}, {"id": "eko_regular", "label": "EKO REGULAR"}, {"id": "diesel", "label": "EKO DIESEL"}, {"id": "EUdiesel", "label": "EURO DIESEL"}],
        "LUKOIL": [{"id": "ecto_100", "label": "100 ECTO"}, {"id": "ecto_95", "label": "95 ECTO"}, {"id": "ecto_92", "label": "92 ECTO"}, {"id": "diesel", "label": "D ECTO"}],
        "ROMPETROL": [{"id": "efix_98", "label": "98 EFIX"}, {"id": "efix_95", "label": "95 EFIX"}, {"id": "efix_92", "label": "92 EFIX"}, {"id": "diesel", "label": "D EFIX"}, {"id": "LPDdiesel", "label": "LPD EFIX"}]
    }
    try:
        stations = db.query(Station).all()
        for s in stations:
            brand_up = s.brand.upper() if s.brand else ""
            if brand_up in configs:
                s.fuel_config = json.dumps(configs[brand_up])
        db.commit()
    finally:
        db.close()

sync_db_fuel_configs()

app = FastAPI(title="Cheap Gasoline Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SETUP UPLOAD DIR ---
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- DEPENDENCY INJECTORS ---
def get_users_db():
    db = UsersSessionLocal()
    try: yield db
    finally: db.close()

def get_stations_db():
    db = StationsSessionLocal()
    try: yield db
    finally: db.close()

def get_prices_db():
    db = PricesSessionLocal()
    try: yield db
    finally: db.close()

def get_siteinfo_db():
    db = SiteInfoSessionLocal()
    try: yield db
    finally: db.close()

# --- СХЕМЫ ---
class ManualPriceUpdate(BaseModel):
    station_id: int
    prices: Dict[str, str]
    user_id: Optional[int] = None

class ResetPasswordData(BaseModel):
    email: str
    new_password: str

# --- ЭНДПОИНТЫ ---

@app.get("/api/stations")
def get_stations(db: Session = Depends(get_stations_db)):
    """Получить все станции с ценами и геоданными"""
    stations = db.query(Station).all()
    result = []
    prices_db = PricesSessionLocal()
    
    try:
        for s in stations:
            f_config = json.loads(s.fuel_config or "[]")
            prices_data = []
            for fuel in f_config:
                last_price = prices_db.query(PriceUpdate).filter(
                    PriceUpdate.station_id == s.id, 
                    PriceUpdate.fuel_type == fuel['id']
                ).order_by(PriceUpdate.timestamp.desc()).first()
                prices_data.append({
                    "id": fuel['id'], 
                    "type": fuel['label'], 
                    "price": float(last_price.price) if last_price else None
                })
            
            result.append({
                "id": s.id,
                "name": s.name,
                "brand": s.brand,
                "lat": float(s.lat),
                "lng": float(s.lng),
                "prices": prices_data
            })
    finally:
        prices_db.close()
    
    return result

@app.post("/api/auth/register")
async def auth_register(user_data: Dict[str, str], db: Session = Depends(get_users_db)):
    email = user_data.get("email")
    password = user_data.get("password")
    name = user_data.get("name", "User")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Укажите email и пароль")
    
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Этот email уже зарегистрирован")
    
    hashed = auth_utils.get_password_hash(password)
    new_user = User(email=email, name=name, hashed_password=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Log action
    log_action(
        action="user_created",
        user_id=new_user.id,
        details=f"User registered: {email}"
    )
    
    token = auth_utils.create_access_token({"sub": str(new_user.id), "email": new_user.email})
    return {
        "user": {"id": new_user.id, "email": new_user.email, "name": new_user.name, "is_admin": new_user.is_admin}, 
        "token": token
    }

@app.post("/api/auth/login")
async def auth_login(user_data: Dict[str, str], db: Session = Depends(get_users_db)):
    email = user_data.get("email")
    password = user_data.get("password")
    
    user = db.query(User).filter(User.email == email).first()
    
    if not user or not auth_utils.verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    
    token = auth_utils.create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "user": {"id": user.id, "email": user.email, "name": user.name, "is_admin": user.is_admin}, 
        "token": token
    }

@app.post("/api/force-reset-password")
async def force_reset_password(data: ResetPasswordData, db: Session = Depends(get_users_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    user.hashed_password = auth_utils.get_password_hash(data.new_password)
    db.commit()
    return {"status": "success", "message": "Password updated"}

@app.post("/api/update-price-manual")
async def update_price(data: ManualPriceUpdate, db: Session = Depends(get_prices_db)):
    try:
        for f_type, p_val in data.prices.items():
            if not p_val or p_val == "—": 
                continue
            db.add(PriceUpdate(
                station_id=data.station_id, 
                fuel_type=f_type, 
                price=float(p_val), 
                user_id=data.user_id
            ))
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/add-station")
async def add_station(station_data: Dict[str, Any], db: Session = Depends(get_stations_db)):
    try:
        new_s = Station(
            name=station_data.get('name'), 
            brand=station_data.get('brand'), 
            lat=float(station_data.get('lat', 0)), 
            lng=float(station_data.get('lng', 0)), 
            fuel_config=json.dumps(station_data.get('fuel_config', []))
        )
        db.add(new_s)
        db.commit()
        db.refresh(new_s)
        return {"status": "ok", "id": new_s.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/site-info")
async def get_site_info(db: Session = Depends(get_siteinfo_db)):
    info = db.query(SiteInfo).all()
    return {item.key: item.value for item in info}

@app.post("/api/site-info/{key}")
async def set_site_info(key: str, data: Dict[str, str], db: Session = Depends(get_siteinfo_db)):
    item = db.query(SiteInfo).filter(SiteInfo.key == key).first()
    if item:
        item.value = data.get("value", "")
    else:
        item = SiteInfo(key=key, value=data.get("value", ""), description=data.get("description", ""))
        db.add(item)
    db.commit()
    return {"status": "success"}

@app.get("/api/user/{user_id}/profile")
async def get_user_profile(user_id: int, db: Session = Depends(get_users_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    return {
        "user": {"id": user.id, "email": user.email, "name": user.name, "is_admin": user.is_admin},
        "profile": {
            "avatar_url": user.avatar_url,
            "bio": user.bio,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    }

@app.post("/api/user/{user_id}/profile")
async def update_user_profile(user_id: int, data: Dict[str, Any], db: Session = Depends(get_users_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    user.avatar_url = data.get("avatar_url", user.avatar_url)
    user.bio = data.get("bio", user.bio)
    user.updated_at = datetime.datetime.utcnow()
    
    db.commit()
    return {"status": "success"}

@app.get("/")
def root():
    return {"message": "Cheap Gasoline API running. See /docs for interactive API."}

@app.post("/api/upload-photo")
def upload_photo(file: UploadFile = File(...)):
    """Загрузить фото (для OCR или других целей)"""
    try:
        suffix = os.path.splitext(file.filename)[1]
        dest_path = os.path.join(UPLOAD_DIR, f"upload_{os.urandom(6).hex()}{suffix}")
        with open(dest_path, "wb") as f:
            f.write(file.file.read())
        
        return {
            "filename": os.path.basename(dest_path),
            "path": f"/api/uploads/{os.path.basename(dest_path)}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/uploads/{filename}")
def get_upload(filename: str):
    """Получить загруженный файл"""
    fpath = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(fpath)

# --- HELPER: LOG ACTION ---
def log_action(action: str, user_id: int = None, target_user_id: int = None, details: str = None, ip: str = None):
    """Логировать действие в AuditLog"""
    try:
        db = SiteInfoSessionLocal()
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            target_user_id=target_user_id,
            details=details,
            ip_address=ip
        )
        db.add(log_entry)
        db.commit()
        db.close()
    except Exception as e:
        print(f"Log error: {e}")

# --- ADMIN ENDPOINTS ---
@app.get("/api/admin/users")
def admin_get_users(current_user: User = Depends(get_current_user)):
    """Получить всех пользователей (только для админов)"""
    if current_user.role not in ["admin", "superadmin"] and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = UsersSessionLocal()
    try:
        users = db.query(User).all()
        return [{
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "role": u.role,
            "is_admin": u.is_admin,
            "avatar_url": u.avatar_url,
            "bio": u.bio,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "updated_at": u.updated_at.isoformat() if u.updated_at else None
        } for u in users]
    finally:
        db.close()

@app.put("/api/admin/user/{user_id}/role")
def admin_update_user_role(user_id: int, role_data: Dict[str, str], current_user: User = Depends(get_current_user)):
    """Изменить роль пользователя"""
    if current_user.role not in ["admin", "superadmin"] and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if current_user.id == user_id and role_data.get("role") != current_user.role:
        raise HTTPException(status_code=400, detail="Cannot change own role")
    
    db = UsersSessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        old_role = user.role
        new_role = role_data.get("role", "user")
        
        if new_role not in ["user", "moderator", "admin", "superadmin"]:
            raise HTTPException(status_code=400, detail="Invalid role")
        
        user.role = new_role
        user.is_admin = (new_role in ["admin", "superadmin"])
        db.commit()
        
        # Log action
        log_action(
            action="role_changed",
            user_id=current_user.id,
            target_user_id=user_id,
            details=f"Role changed from {old_role} to {new_role}"
        )
        
        return {"success": True, "message": f"Role changed to {new_role}"}
    finally:
        db.close()

@app.delete("/api/admin/user/{user_id}")
def admin_delete_user(user_id: int, current_user: User = Depends(get_current_user)):
    """Удалить пользователя"""
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    db = UsersSessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        email = user.email
        db.delete(user)
        db.commit()
        
        # Log action
        log_action(
            action="user_deleted",
            user_id=current_user.id,
            target_user_id=user_id,
            details=f"Deleted user: {email}"
        )
        
        return {"success": True, "message": f"User {email} deleted"}
    finally:
        db.close()

@app.get("/api/admin/logs")
def admin_get_logs(current_user: User = Depends(get_current_user), limit: int = 100):
    """Получить логи аудита"""
    if current_user.role not in ["admin", "superadmin"] and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = SiteInfoSessionLocal()
    try:
        logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
        return [{
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "target_user_id": log.target_user_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat() if log.created_at else None
        } for log in logs]
    finally:
        db.close()

@app.post("/api/admin/user/{user_id}/ban")
def admin_ban_user(user_id: int, ban_data: Dict[str, str], current_user: User = Depends(get_current_user)):
    """Заблокировать пользователя"""
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = UsersSessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.role = "banned"
        db.commit()
        
        log_action(
            action="user_banned",
            user_id=current_user.id,
            target_user_id=user_id,
            details=ban_data.get("reason", "No reason provided")
        )
        
        return {"success": True, "message": f"User {user.email} banned"}
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)