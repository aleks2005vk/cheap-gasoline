"""
Authentication module для Cheap Gasoline
Firebase Auth integration, role-based access control
"""

import os
import json
from datetime import datetime, timedelta
from typing import Optional, Dict
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer
from sqlmodel import Session, select
import firebase_admin
from firebase_admin import auth, credentials

# ============ FIREBASE INITIALIZATION ============
# Try multiple methods to load Firebase credentials
def init_firebase():
    """Initialize Firebase with credentials from file or environment"""
    try:
        # Check if already initialized
        firebase_admin.get_app()
        print("✅ Firebase already initialized")
        return
    except ValueError:
        pass  # Not initialized yet
    
    try:
        # Method 1: Load from file (local development)
        if os.path.exists("firebase-service-account.json"):
            cred = credentials.Certificate("firebase-service-account.json")
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized from file")
            return
    except Exception as e:
        print(f"⚠️ File load failed: {e}")
    
    try:
        # Method 2: Load from GOOGLE_APPLICATION_CREDENTIALS env var (Render)
        if os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
            cred = credentials.Certificate(os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"))
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized from GOOGLE_APPLICATION_CREDENTIALS")
            return
    except Exception as e:
        print(f"⚠️ Environment credentials failed: {e}")
    
    try:
        # Method 3: Load from FIREBASE_SERVICE_ACCOUNT_KEY env var (as JSON string)
        firebase_key_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY")
        if firebase_key_json:
            key_dict = json.loads(firebase_key_json)
            cred = credentials.Certificate(key_dict)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized from FIREBASE_SERVICE_ACCOUNT_KEY env")
            return
    except Exception as e:
        print(f"⚠️ JSON string credentials failed: {e}")
    
    print("❌ Firebase initialization failed - no credentials found")
    print("   Set one of: firebase-service-account.json file, GOOGLE_APPLICATION_CREDENTIALS, or FIREBASE_SERVICE_ACCOUNT_KEY env var")

# Initialize on startup
init_firebase()

# HTTP Bearer scheme
security = HTTPBearer()


# ============ FIREBASE AUTH ============

async def get_current_user(credentials = Depends(security)) -> Dict:
    """Получить текущего пользователя из Firebase ID token с Custom Claims"""
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        firebase_uid = decoded_token['uid']
        email = decoded_token.get('email', '')

        # Получить роль из Firebase Custom Claims
        user_role = decoded_token.get('role', 'user')  # По умолчанию 'user'

        # Найти пользователя в локальной БД по email для дополнительных данных
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
            "role": user_role,  # Используем роль из Firebase Custom Claims
            "firebase_uid": firebase_uid,
            "email": email,
            "name": user.name
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


# ============ ROLE MANAGEMENT ============

async def set_user_role(firebase_uid: str, role: str, current_user: Dict = Depends(get_current_user)):
    """
    Установить роль пользователю через Firebase Custom Claims
    Только админы могут менять роли
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can change user roles")

    try:
        # Валидация роли
        valid_roles = ["admin", "moderator", "station_owner", "user", "guest"]
        if role not in valid_roles:
            raise HTTPException(status_code=400, detail=f"Invalid role. Valid roles: {', '.join(valid_roles)}")

        # Установить Custom Claims
        auth.set_custom_user_claims(firebase_uid, {"role": role})

        return {"message": f"Role '{role}' assigned to user {firebase_uid}"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set user role: {str(e)}")


async def get_user_role(firebase_uid: str, current_user: Dict = Depends(get_current_user)):
    """
    Получить роль пользователя из Firebase Custom Claims
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view user roles")

    try:
        # Получить информацию о пользователе
        user = auth.get_user(firebase_uid)
        custom_claims = user.custom_claims or {}

        return {
            "firebase_uid": firebase_uid,
            "email": user.email,
            "role": custom_claims.get("role", "user"),
            "custom_claims": custom_claims
        }

    except Exception as e:
        raise HTTPException(status_code=404, detail=f"User not found: {str(e)}")


async def list_users_with_roles(current_user: Dict = Depends(get_current_user)):
    """
    Получить список всех пользователей с их ролями
    Только для админов
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can list users")

    try:
        # Получить всех пользователей (с пагинацией для больших списков)
        users = []
        page = auth.list_users()

        for user in page.iterate_all():
            custom_claims = user.custom_claims or {}
            users.append({
                "firebase_uid": user.uid,
                "email": user.email,
                "display_name": user.display_name,
                "role": custom_claims.get("role", "user"),
                "email_verified": user.email_verified,
                "disabled": user.disabled,
                "created_at": user.user_metadata.creation_timestamp,
                "last_sign_in": user.user_metadata.last_sign_in_timestamp
            })

        return {"users": users, "total": len(users)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list users: {str(e)}")


def require_admin(current_user: Dict = Depends(get_current_user)):
    """Декоратор: требование админской роли"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def require_moderator(current_user: Dict = Depends(get_current_user)):
    """Декоратор: требование роли модератора или выше"""
    user_role = current_user.get("role", "guest")
    if user_role not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Moderator access required")
    return current_user
