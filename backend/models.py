from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
from datetime import datetime

class PriceUpdate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    station_id: int = Field(index=True)
    fuel_type: Optional[str] = None
    price: Optional[float] = None
    source: Optional[str] = None
    note: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Station(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: Optional[str] = None
    brand: Optional[str] = None
    lat: float
    lng: float
    osm_id: Optional[int] = None
    address: Optional[str] = None


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    name: Optional[str] = None
    hashed_password: Optional[str] = None
    avatar: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
