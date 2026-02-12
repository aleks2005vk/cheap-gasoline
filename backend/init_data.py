"""
Скрипт инициализации БД с примерами станций, цен и информации о сайте.
Запустите один раз: python init_data.py
"""
import json
import datetime
import os
import sys

# Убедимся что папка data существует
os.makedirs("data", exist_ok=True)

from main import (
    Station, StationsBase, stations_engine, StationsSessionLocal,
    PriceUpdate, PricesBase, prices_engine, PricesSessionLocal,
    SiteInfo, SiteInfoBase, siteinfo_engine, SiteInfoSessionLocal,
    User, UsersBase, users_engine, UsersSessionLocal
)
import auth_utils

# Создаем таблицы
UsersBase.metadata.create_all(bind=users_engine)
StationsBase.metadata.create_all(bind=stations_engine)
PricesBase.metadata.create_all(bind=prices_engine)
SiteInfoBase.metadata.create_all(bind=siteinfo_engine)

# === ИНИЦИАЛИЗАЦИЯ СТАНЦИЙ ===
def init_stations():
    db = StationsSessionLocal()
    
    # Проверяем, есть ли уже станции
    count = db.query(Station).count()
    if count > 0:
        print(f"✓ В БД уже есть {count} станций")
        db.close()
        return
    
    # Загружаем из points.json
    points_file = os.path.join(os.path.dirname(__file__), "points.json")
    if not os.path.exists(points_file):
        print(f"✗ Файл {points_file} не найден")
        db.close()
        return
    
    try:
        # Пробуем разные кодировки
        encodings = ['utf-16', 'utf-8-sig', 'utf-8', 'latin-1']
        points_data = None
        
        for enc in encodings:
            try:
                with open(points_file, 'r', encoding=enc) as f:
                    content = f.read()
                    points_data = json.loads(content)
                print(f"✓ Файл загружен с кодировкой {enc}")
                break
            except Exception as e:
                continue
        
        if points_data is None:
            print("✗ Не удалось загрузить points.json ни с какой кодировкой")
            db.close()
            return
        
        added = 0
        for point in points_data:
            # Определяем бренд по названию или используем дефолт
            brand = "SOCAR"
            name_upper = (point.get('name') or '').upper()
            if 'WISSOL' in name_upper:
                brand = "WISSOL"
            elif 'GULF' in name_upper:
                brand = "GULF"
            elif 'LUKOIL' in name_upper:
                brand = "LUKOIL"
            elif 'ROMPETROL' in name_upper:
                brand = "ROMPETROL"
            
            # Определяем конфиг топлива по бренду
            brand_upper = brand.upper()
            configs = {
                "SOCAR": [{"id": "n95", "label": "NANO 95"}, {"id": "n92", "label": "NANO 92"}, {"id": "diesel", "label": "NANO DT"}, {"id": "lpg", "label": "LPG"}],
                "GULF": [{"id": "g98", "label": "G-Force 98"}, {"id": "g95", "label": "G-Force 95"}, {"id": "diesel", "label": "G-Force D"}],
                "WISSOL": [{"id": "eko_super", "label": "EKO SUPER"}, {"id": "eko_regular", "label": "EKO REGULAR"}, {"id": "diesel", "label": "EKO DIESEL"}],
                "LUKOIL": [{"id": "ecto_95", "label": "95 ECTO"}, {"id": "ecto_92", "label": "92 ECTO"}, {"id": "diesel", "label": "D ECTO"}],
                "ROMPETROL": [{"id": "efix_98", "label": "98 EFIX"}, {"id": "efix_95", "label": "95 EFIX"}, {"id": "diesel", "label": "D EFIX"}]
            }
            fuel_config = configs.get(brand_upper, configs["SOCAR"])
            
            station = Station(
                name=point.get('name', 'Unknown Station'),
                brand=brand,
                lat=float(point.get('lat', 41.769)),
                lng=float(point.get('lng', 44.784)),
                fuel_config=json.dumps(fuel_config),
                created_at=datetime.datetime.utcnow(),
                updated_at=datetime.datetime.utcnow()
            )
            db.add(station)
            added += 1
            
            # Коммитим по 100 записей для оптимизации
            if added % 100 == 0:
                db.commit()
                print(f"  → Загружено {added} станций...")
        
        db.commit()
        print(f"✓ Загружено {added} станций из points.json")
    except Exception as e:
        db.rollback()
        print(f"✗ Ошибка при загрузке станций: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

# === ИНИЦИАЛИЗАЦИЯ ЦЕН ===
def init_prices():
    db = PricesSessionLocal()
    
    # Проверяем, есть ли уже цены
    count = db.query(PriceUpdate).count()
    if count > 0:
        print(f"✓ В БД уже есть {count} записей цен")
        db.close()
        return
    
    # Примерные цены для каждой станции
    sample_prices = [
        (1, "n95", 3.19),
        (1, "n92", 2.99),
        (1, "diesel", 3.05),
        (1, "lpg", 1.65),
        (2, "g98", 3.25),
        (2, "g95", 3.15),
        (2, "diesel", 3.10),
        (3, "ecto_100", 3.22),
        (3, "ecto_95", 3.12),
        (3, "ecto_92", 2.95),
        (3, "diesel", 3.08),
        (4, "eko_super", 3.20),
        (4, "eko_premium", 3.10),
        (4, "eko_regular", 2.98),
        (4, "diesel", 3.06),
        (5, "efix_98", 3.23),
        (5, "efix_95", 3.13),
        (5, "efix_92", 2.97),
        (5, "diesel", 3.07),
    ]
    
    try:
        for station_id, fuel_type, price in sample_prices:
            price_update = PriceUpdate(
                station_id=station_id,
                fuel_type=fuel_type,
                price=price,
                timestamp=datetime.datetime.utcnow(),
                source="init_data"
            )
            db.add(price_update)
        
        db.commit()
        print(f"✓ Добавлено {len(sample_prices)} записей цен")
    except Exception as e:
        db.rollback()
        print(f"✗ Ошибка при добавлении цен: {e}")
    finally:
        db.close()

# === ИНИЦИАЛИЗАЦИЯ ИНФОРМАЦИИ О САЙТЕ ===
def init_site_info():
    db = SiteInfoSessionLocal()
    
    # Проверяем, есть ли уже инфо
    count = db.query(SiteInfo).count()
    if count > 0:
        print(f"✓ В БД уже есть {count} записей о сайте")
        db.close()
        return
    
    site_data = [
        ("app_title", "Cheap Gasoline - Лучшие цены на топливо в Грузии", "Название приложения"),
        ("app_description", "Найдите ближайшую АЗС с лучшими ценами на бензин и дизель", "Описание приложения"),
        ("support_email", "support@cheapgasoline.ge", "Email поддержки"),
        ("currency", "GEL", "Валюта"),
        ("default_city", "Tbilisi", "Город по умолчанию"),
    ]
    
    try:
        for key, value, description in site_data:
            site_info = SiteInfo(
                key=key,
                value=value,
                description=description,
                updated_at=datetime.datetime.utcnow()
            )
            db.add(site_info)
        
        db.commit()
        print(f"✓ Добавлено {len(site_data)} записей о сайте")
    except Exception as e:
        db.rollback()
        print(f"✗ Ошибка при добавлении информации о сайте: {e}")
    finally:
        db.close()

# === ИНИЦИАЛИЗАЦИЯ СУПЕРАДМИНА ===
def init_superadmin():
    db = UsersSessionLocal()
    
    # Проверяем, есть ли уже суперадмины
    superadmin = db.query(User).filter(User.role == "superadmin").first()
    if superadmin:
        print(f"✓ Суперадмин уже существует: {superadmin.email}")
        db.close()
        return
    
    # Создаём суперадмина по умолчанию
    default_admin = {
        "email": "admin@gasoline.ge",
        "password": "Admin123456",  # ⚠️ ИЗМЕНИТЕ ПАРОЛЬ!
        "name": "Super Admin"
    }
    
    try:
        hashed = auth_utils.get_password_hash(default_admin["password"])
        superadmin_user = User(
            email=default_admin["email"],
            name=default_admin["name"],
            hashed_password=hashed,
            role="superadmin",
            is_admin=True,
            created_at=datetime.datetime.utcnow(),
            updated_at=datetime.datetime.utcnow()
        )
        db.add(superadmin_user)
        db.commit()
        print(f"✓ Создан суперадмин: {default_admin['email']}")
        print(f"⚠️  Пароль по умолчанию: {default_admin['password']}")
        print(f"⚠️  РЕКОМЕНДУЕТСЯ ИЗМЕНИТЬ ПАРОЛЬ ПОСЛЕ ПЕРВОГО ВХОДА!")
    except Exception as e:
        db.rollback()
        print(f"✗ Ошибка при создании суперадмина: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 50)
    print("Инициализация базы данных...")
    print("=" * 50)
    init_superadmin()
    init_stations()
    init_prices()
    init_site_info()
    print("=" * 50)
    print("✓ Инициализация завершена!")
    print("=" * 50)
