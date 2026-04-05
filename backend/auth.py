"""
Authentication module для Cheap Gasoline
Firebase Auth integration, role-based access control
"""

import os
from typing import Optional, Dict
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer
from sqlmodel import Session, select
import firebase_admin
from firebase_admin import auth, credentials
import json

# Инициализация Firebase
try:
    cred = credentials.Certificate("firebase-service-account.json")  # Путь к ключу в backend/
    firebase_admin.initialize_app(cred)
    print("✅ Firebase initialized")
except Exception as e:
    print(f"⚠️ Firebase init: {e}")

# HTTP Bearer scheme
security = HTTPBearer()


# ============ FIREBASE AUTH ============

async def get_current_user(credentials = Depends(security)) -> Dict:
    """Получить текущего пользователя из Firebase ID token"""
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        firebase_uid = decoded_token['uid']
        email = decoded_token.get('email', '')

        # Найти пользователя в локальной БД по email
        from models import User
        from database import get_session
        db = next(get_session())
        user = db.exec(select(User).where(User.email == email)).first()
        db.close()

        if not user:
            raise HTTPException(status_code=401, detail="User not found in database")

        if user.is_banned:
            raise HTTPException(status_code=403, detail="User is banned")

        return {
            "user_id": user.id,
            "role": user.role,
            "firebase_uid": firebase_uid
        }

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Firebase token: {str(e)}")


async def get_current_user_with_db(
    credentials = Depends(security),
    db: Session = None
):
    """Получить объект пользователя из БД"""
    from models import User

    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        email = decoded_token.get('email', '')

        statement = select(User).where(User.email == email)
        user = db.exec(statement).first()

        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        if user.is_banned:
            raise HTTPException(status_code=403, detail="User is banned")

        return user

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Firebase token: {str(e)}")


def check_permission(user_role: str, required_permission: str) -> bool:
    """Проверить базовое разрешение по роли"""
    # Иерархия: ADMIN > STATION_OWNER > MODERATOR > USER > GUEST
    permissions_map = {
        "admin": [
            "view_map", "update_prices", "moderate", "flag_prices",
            "admin", "manage_users", "ban_users", "change_roles", "delete_stations"
        ],
        "station_owner": [
            "view_map", "update_prices_own_station", "manage_own_station"
        ],
        "moderator": [
            "view_map", "update_prices", "moderate", "flag_prices", "approve_prices"
        ],
        "user": [
            "view_map", "update_prices_suggest"  # Предложение, которое идет на модерацию
        ],
        "guest": [
            "view_map"
        ]
    }
    
    return required_permission in permissions_map.get(user_role, [])


def require_role(*allowed_roles):
    """Декоратор: требование конкретной роли или выше в иерархии"""
    async def role_checker(current_user: Dict = Depends(get_current_user)):
        user_role = current_user.get("role")
        
        # Иерархия ролей
        role_hierarchy = {
            "admin": 4,
            "station_owner": 3,
            "moderator": 2,
            "user": 1,
            "guest": 0
        }
        
        user_level = role_hierarchy.get(user_role, 0)
        required_level = max([role_hierarchy.get(r, 0) for r in allowed_roles])
        
        if user_level < required_level:
            raise HTTPException(
                status_code=403,
                detail=f"Required role: {', '.join(allowed_roles)}. Your role: {user_role}"
            )
        
        return current_user
    
    return role_checker


async def require_station_owner_for_station(
    station_id: int,
    current_user: Dict = Depends(get_current_user),
    db: Session = None
):
    """
    Проверка: STATION_OWNER может управлять ТОЛЬКО своими станциями
    Использование: dependencies=[Depends(lambda: require_station_owner_for_station(station_id))]
    """
    # ADMIN имеет доступ ко всему
    if current_user["role"] == "admin":
        return current_user
    
    # STATION_OWNER может управлять только своими
    if current_user["role"] == "station_owner":
        from sqlmodel import select
        from models import UserStation
        
        # Проверить: есть ли связь User -> Station
        stmt = select(UserStation).where(
            UserStation.user_id == current_user["user_id"],
            UserStation.station_id == station_id
        )
        relation = db.exec(stmt).first()
        
        if not relation:
            raise HTTPException(
                status_code=403,
                detail=f"You don't have permission to manage station {station_id}"
            )
        
        return current_user
    
    # Все остальные - нет доступа
    raise HTTPException(status_code=403, detail="Only ADMIN or STATION_OWNER can update prices")


def require_permission_dependency(required_permission: str):
    """Зависимость для проверки разрешения"""
    async def verify_permission(current_user: Dict = Depends(get_current_user)):
        if not check_permission(current_user["role"], required_permission):
            raise HTTPException(
                status_code=403,
                detail=f"Permission '{required_permission}' required. Your role: {current_user['role']}"
            )
        return current_user
    
    return verify_permission


# ============ RATE LIMITING (базовый) ============

class RateLimiter:
    """Простой rate limiter на основе памяти"""
    def __init__(self):
        self.requests: Dict[str, list] = {}
    
    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """
        Проверить, разрешен ли запрос
        key: уникальный идентификатор (IP, user_id и т.д.)
        max_requests: максимум запросов в окне
        window_seconds: размер временного окна
        """
        now = datetime.utcnow()
        cutoff = now - timedelta(seconds=window_seconds)
        
        # Инициализировать, если не существует
        if key not in self.requests:
            self.requests[key] = []
        
        # Удалить старые запросы
        self.requests[key] = [ts for ts in self.requests[key] if ts > cutoff]
        
        # Если уже достигнут лимит
        if len(self.requests[key]) >= max_requests:
            return False
        
        # Добавить текущий запрос
        self.requests[key].append(now)
        return True


# Глобальный экземпляр rate limiter
rate_limiter = RateLimiter()


def rate_limit_dependency(max_requests: int = 10, window_seconds: int = 60):
    """Зависимость для rate limiting по IP"""
    async def verify_rate_limit(
        request,
        current_user: Optional[Dict] = None
    ):
        # Использовать user_id если аутентифицирован, иначе IP
        key = f"user_{current_user['user_id']}" if current_user else request.client.host
        
        if not rate_limiter.is_allowed(f"rate_limit:{key}", max_requests, window_seconds):
            raise HTTPException(
                status_code=429,
                detail="Too many requests"
            )
        
        return True
    
    return verify_rate_limit
