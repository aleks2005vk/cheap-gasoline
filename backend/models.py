"""
SQLModel для Cheap Gasoline API
v2.0: Full RBAC system (ADMIN, STATION_OWNER, USER, GUEST)
"""

from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ============ ENUM РОЛЕЙ ============

class RoleEnum(str, Enum):
    """Иерархия ролей: ADMIN > STATION_OWNER > USER > GUEST"""
    ADMIN = "admin"                    # Полный доступ: удаление станций, бан пользователей, назначение ролей
    STATION_OWNER = "station_owner"    # Управление ценами только на своих станциях
    MODERATOR = "moderator"            # Проверка подозрительных обновлений
    USER = "user"                      # Предложение изменения цены (нужна модерация)
    GUEST = "guest"                    # Только просмотр


# ============ MANY-TO-MANY: USER - STATION ============

class UserStation(SQLModel, table=True):
    """Связь: Какой сотрудник может управлять какой заправкой"""
    user_id: int = Field(foreign_key="user.id", primary_key=True)
    station_id: int = Field(foreign_key="station.id", primary_key=True)
    
    # Дополнительные данные
    role_at_station: str = Field(default="employee")  # "employee", "manager", "supervisor"
    assigned_at: datetime = Field(default_factory=datetime.utcnow)


# ============ БАЗОВЫЕ МОДЕЛИ ============

class User(SQLModel, table=True):
    """Пользователь с RBAC ролями"""
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    # hashed_password: str  # Удалено: пароли теперь в Firebase Auth
    name: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    
    # RBAC роли
    role: str = Field(default=RoleEnum.GUEST, index=True)
    is_banned: bool = Field(default=False)
    ban_reason: Optional[str] = None
    
    # Система кармы
    karma_points: int = Field(default=0)
    verification_score: float = Field(default=0.0)  # 0-100
    
    # Статистика
    total_updates: int = Field(default=0)
    confirmed_updates: int = Field(default=0)
    
    # Служебные
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    
    # Связи
    profile: Optional["UserProfile"] = Relationship(back_populates="user")
    contributions: List["ContributionHistory"] = Relationship(back_populates="user")
    confirmations: List["PriceConfirmation"] = Relationship(back_populates="user")
    achievements: List["UserAchievement"] = Relationship(back_populates="user")
    
    # Станции которыми может управлять (для STATION_OWNER)
    # Примечание: В SQLModel это будет работать через UserStation таблицу
    # managed_stations: List["Station"] = Relationship(back_populates="managers")


class UserProfile(SQLModel, table=True):
    """Профиль с предпочтениями"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True)
    
    # Для STATION_OWNER: примечание о компании
    company_name: Optional[str] = None
    phone: Optional[str] = None
    
    # Предпочтения для обычных пользователей
    favorite_fuel_types: str = Field(default="[]")  # JSON: ["92", "95", "diesel"]
    favorite_station_ids: str = Field(default="[]")  # JSON: [1, 2, 3]
    notification_radius_km: int = Field(default=5)
    notifications_enabled: bool = Field(default=True)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Связь
    user: Optional[User] = Relationship(back_populates="profile")


class Station(SQLModel, table=True):
    """АЗС с координатами и владельцем"""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: Optional[str] = Field(index=True) 
    brand: Optional[str] = None
    lat: float = Field(index=True)
    lng: float = Field(index=True)
    osm_id: Optional[int] = Field(unique=True, index=True)
    address: Optional[str] = None
    fuel_config: Optional[str] = None
    
    # Управление
    owner_company: Optional[str] = None  # Для STATION_OWNER: компания-владелец
    is_verified: bool = Field(default=False)  # Проверена ли станция администратором
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Связи
    price_updates: List["PriceUpdate"] = Relationship(back_populates="station")
    contributions: List["ContributionHistory"] = Relationship(back_populates="station")
    price_history: List["PriceHistory"] = Relationship(back_populates="station")


class PriceUpdate(SQLModel, table=True):
    """Обновление цены"""
    id: Optional[int] = Field(default=None, primary_key=True)
    station_id: int = Field(foreign_key="station.id", index=True)
    fuel_type: Optional[str] = Field(index=True)
    price: Optional[float] = None
    source: Optional[str] = None  # "user", "station_owner", "api"
    note: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    
    # Связи
    station: Optional[Station] = Relationship(back_populates="price_updates")


# ============ МОДЕЛИ УПРАВЛЕНИЯ И КАРМЫ ============

class ContributionHistory(SQLModel, table=True):
    """История вкладов пользователя"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    station_id: int = Field(foreign_key="station.id", index=True)
    
    fuel_type: str
    old_price: Optional[float] = None
    new_price: float
    status: str = Field(default="pending")  # pending/confirmed/rejected
    confirmation_count: int = Field(default=0)
    rejection_count: int = Field(default=0)
    photo_url: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    
    # Связи
    user: Optional[User] = Relationship(back_populates="contributions")
    station: Optional[Station] = Relationship(back_populates="contributions")


class PriceConfirmation(SQLModel, table=True):
    """Подтверждение цены (голосование)"""
    id: Optional[int] = Field(default=None, primary_key=True)
    contribution_id: int = Field(foreign_key="contributionhistory.id")
    user_id: int = Field(foreign_key="user.id", index=True)
    is_correct: bool
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Связь
    user: Optional[User] = Relationship(back_populates="confirmations")


class FlaggedPrice(SQLModel, table=True):
    """Подозрительные цены"""
    id: Optional[int] = Field(default=None, primary_key=True)
    contribution_id: int = Field(foreign_key="contributionhistory.id")
    reason: str  # "impossibly_low", "spam", "fraud"
    status: str = Field(default="pending")  # pending/approved/dismissed
    flagged_by_user_id: int = Field(foreign_key="user.id")
    moderator_id: Optional[int] = Field(foreign_key="user.id", default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RolePermission(SQLModel, table=True):
    """Справочник прав ролей"""
    id: Optional[int] = Field(default=None, primary_key=True)
    role: str = Field(unique=True)
    permissions: str  # JSON: ["view_map", "update_prices", "moderate", "admin"]
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AuditLog(SQLModel, table=True):
    """Логирование всех действий"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(foreign_key="user.id", index=True)
    action: str  # "price_update", "user_ban", "role_change"
    target_id: Optional[int] = None
    details: Optional[str] = None  # JSON
    ip_address: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


# ============ МОДЕЛИ v1.5: ИСТОРИЯ ЦЕН ============

class PriceHistory(SQLModel, table=True):
    """Ежедневная история цен для графиков"""
    id: Optional[int] = Field(default=None, primary_key=True)
    station_id: int = Field(foreign_key="station.id", index=True)
    fuel_type: str = Field(index=True)
    
    avg_price: float
    min_price: float
    max_price: float
    update_count: int = Field(default=0)
    
    date: str = Field(index=True)  # ISO format: "2026-02-12"
    
    # Связь
    station: Optional[Station] = Relationship(back_populates="price_history")


class Achievement(SQLModel, table=True):
    """Справочник достижений"""
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(unique=True)  # "scout", "honest_updater"
    name: str
    description: str
    icon: str  # Эмодзи
    criteria: str  # JSON
    reward_karma: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserAchievement(SQLModel, table=True):
    """Достижение пользователя"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    achievement_id: int = Field(foreign_key="achievement.id", index=True)
    
    progress: int = Field(default=0)
    unlocked_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Связь
    user: Optional[User] = Relationship(back_populates="achievements")