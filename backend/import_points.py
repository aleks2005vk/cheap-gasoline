import json
import os
import sys
import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, create_engine, Session, select, delete

# Настройка путей
HERE = os.path.dirname(__file__)
POINTS_JSON_PATH = os.path.join(HERE, 'points.json')
DATABASE_URL = "sqlite:///./cheap_gasoline.db"
engine = create_engine(DATABASE_URL)

# --- МОДЕЛИ ДЛЯ ИМПОРТА (Синхронизировано с main.py) ---
class Station(SQLModel, table=True):
    __tablename__ = "station"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    brand: Optional[str] = None
    lat: float
    lng: float
    address: Optional[str] = None
    fuel_config: Optional[str] = None

class PriceUpdate(SQLModel, table=True):
    __tablename__ = "priceupdate"
    id: Optional[int] = Field(default=None, primary_key=True)
    station_id: int = Field(foreign_key="station.id")
    fuel_type: str
    price: float
    timestamp: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    source: str = "initial_import"

# Правила кнопок
FUEL_RULES = {
    "lukoil": [
        {"id": "regular", "label": "92 Ecto", "icon": "🟢"},
        {"id": "premium", "label": "95 Ecto", "icon": "🟡"},
        {"id": "super", "label": "98 Ecto", "icon": "🔴"},
        {"id": "diesel", "label": "ED Ecto", "icon": "⚫"}
    ],
    "wissol": [
        {"id": "super", "label": "EKO Super", "icon": "🔴"},
        {"id": "premium", "label": "EKO Premium", "icon": "🟡"},
        {"id": "regular", "label": "Euro Regular", "icon": "🟢"},
        {"id": "diesel", "label": "EKO Diesel", "icon": "⚫"}
    ],
    "default": [
        {"id": "regular", "label": "Regular", "icon": "🟢"},
        {"id": "premium", "label": "Premium", "icon": "🟡"},
        {"id": "diesel", "label": "Diesel", "icon": "⚫"}
    ]
}

def import_into_db():
    # Создаем таблицы с правильной структурой
    SQLModel.metadata.drop_all(engine) # На всякий случай удаляем старое
    SQLModel.metadata.create_all(engine)
    
    if not os.path.exists(POINTS_JSON_PATH):
        print(f"Файл не найден: {POINTS_JSON_PATH}")
        return

    # Читаем JSON (используем utf-16 так как у тебя файл в ней)
    with open(POINTS_JSON_PATH, 'r', encoding='utf-16') as f:
        points = json.load(f)

    with Session(engine) as session:
        added_count = 0
        for p in points:
            name = p.get('name', 'Unknown')
            name_lower = name.lower()
            
            # Определяем конфиг кнопок
            config = FUEL_RULES["default"]
            brand_found = "Other"
            for b_key in ["lukoil", "wissol", "gulf", "socar", "rompetrol"]:
                if b_key in name_lower:
                    config = FUEL_RULES.get(b_key, FUEL_RULES["default"])
                    brand_found = b_key.capitalize()
                    break
            
            station = Station(
                name=name,
                brand=brand_found,
                lat=p.get('lat'),
                lng=p.get('lng'),
                address=p.get('description'),
                fuel_config=json.dumps(config)
            )
            session.add(station)
            session.flush()
            
            # Добавляем начальные цены
            prices = p.get('prices', {})
            if prices and isinstance(prices, dict):
                for f_type, f_price in prices.items():
                    if f_price:
                        upd = PriceUpdate(
                            station_id=station.id, 
                            fuel_type=f_type, 
                            price=float(f_price)
                        )
                        session.add(upd)
            
            added_count += 1
        
        session.commit()
        print(f"Успешно импортировано {added_count} станций!")

if __name__ == '__main__':
    import_into_db()