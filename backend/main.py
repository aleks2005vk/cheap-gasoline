import os
import json
import datetime
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Boolean, text
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from fastapi.responses import JSONResponse

# --- CONFIG ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./cheap_gasoline.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MODELS ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String, nullable=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)
    updates = relationship("PriceUpdate", back_populates="author")

class Station(Base):
    __tablename__ = "station"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    brand = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    fuel_config = Column(String)

class PriceUpdate(Base):
    __tablename__ = "priceupdate"
    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("station.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    fuel_type = Column(String)
    price = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    source = Column(String, default="manual_update")
    author = relationship("User", back_populates="updates")

# Создаем таблицы
Base.metadata.create_all(bind=engine)

# --- АВТОМАТИЧЕСКАЯ МИГРАЦИЯ ---
def migrate_db():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN name VARCHAR"))
            conn.commit()
            print("✅ Колонка 'name' добавлена")
        except: pass
        try:
            conn.execute(text("ALTER TABLE priceupdate ADD COLUMN user_id INTEGER REFERENCES users(id)"))
            conn.commit()
            print("✅ Колонка 'user_id' добавлена")
        except: pass

migrate_db()

app = FastAPI()

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# --- SCHEMAS ---
class UserAuth(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

# Схема для получения цен с фронтенда
class ManualPriceUpdate(BaseModel):
    station_id: int
    brand: str
    prices: Dict[str, str] # пример: {"n95": "2.95", "diesel": "2.80"}
    lat: Optional[float] = None
    lng: Optional[float] = None
    station_name: Optional[str] = None

# --- РОУТЫ АВТОРИЗАЦИИ ---

@app.post("/api/auth/register")
async def register(data: UserAuth, db: Session = Depends(get_db)):
    try:
        user_exists = db.query(User).filter(User.email == data.email).first()
        if user_exists:
            return JSONResponse(status_code=400, content={"detail": "Этот Email уже занят"})
        
        new_user = User(
            email=data.email, 
            name=data.name if data.name else data.email.split('@')[0], 
            hashed_password=data.password
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"token": "fake-jwt", "user": {"email": new_user.email, "name": new_user.name}}
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"detail": str(e)})

@app.post("/api/auth/login")
async def login(data: UserAuth, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email, User.hashed_password == data.password).first()
    if not user:
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    return {"token": "fake-jwt", "user": {"email": user.email, "name": user.name}}

# --- РОУТ ОБНОВЛЕНИЯ ЦЕН (ТО ЧТО ТЫ ИСКАЛ) ---

@app.post("/api/update-price-manual")
async def update_price_manual(data: ManualPriceUpdate, db: Session = Depends(get_db)):
    try:
        # Проверяем, существует ли станция
        station = db.query(Station).filter(Station.id == data.station_id).first()
        if not station:
            # Если станции нет, можно её создать (опционально)
            raise HTTPException(status_code=404, detail="Станция не найдена в базе")

        # Сохраняем каждую цену из словаря prices
        for fuel_type, price_val in data.prices.items():
            if not price_val or price_val == "—": continue
            
            new_update = PriceUpdate(
                station_id=data.station_id,
                fuel_type=fuel_type,
                price=float(price_val),
                timestamp=datetime.datetime.utcnow(),
                source="user_photo"
            )
            db.add(new_update)
        
        db.commit()
        return {"status": "success", "message": "Цены успешно обновлены"}
    except Exception as e:
        db.rollback()
        print(f"Ошибка при обновлении цен: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- СПИСОК СТАНЦИЙ ---
@app.get("/api/stations")
def list_stations(db: Session = Depends(get_db)):
    stations = db.query(Station).all()
    res = []
    for s in stations:
        prices_list = []
        try:
            config = json.loads(s.fuel_config or "[]")
            for f in config:
                fid = f.get('id')
                p = db.query(PriceUpdate).filter(
                    PriceUpdate.station_id == s.id, 
                    PriceUpdate.fuel_type == fid
                ).order_by(PriceUpdate.timestamp.desc()).first()
                prices_list.append({
                    "type": f.get('label', fid), 
                    "price": str(p.price) if p else "—",
                    "id": fid
                })
        except: pass
        res.append({
            "id": s.id, 
            "name": s.name, 
            "brand": s.brand, 
            "lat": s.lat, 
            "lng": s.lng, 
            "prices": prices_list
        })
    return res

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)