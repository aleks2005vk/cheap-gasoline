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

from database import get_session
from models import (
    User, UserProfile, Station, PriceUpdate, 
    ContributionHistory, PriceConfirmation, FlaggedPrice,
    RolePermission, AuditLog, PriceHistory, Achievement, UserAchievement,
    UserStation
)
def init_stations():
    db = get_session()
    
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
            
            # Используем fuel_config из points.json, если он есть, иначе генерируем по бренду
            fuel_config = None
            if point.get('fuel_config'):
                try:
                    fuel_config = json.loads(point.get('fuel_config'))
                except:
                    pass
            
            if not fuel_config:
                # Определяем конфиг топлива по бренду
                brand_upper = brand.upper()
                configs = {
                    "SOCAR": [{"id": "regular", "label": "Regular"}, {"id": "premium", "label": "Premium"}, {"id": "diesel", "label": "Diesel"}],
                    "GULF": [{"id": "regular", "label": "Regular"}, {"id": "premium", "label": "Premium"}, {"id": "diesel", "label": "Diesel"}],
                    "WISSOL": [{"id": "eko_regular", "label": "EKO REGULAR"}, {"id": "eko_premium", "label": "EKO PREMIUM"}, {"id": "eko_super", "label": "EKO SUPER"}, {"id": "diesel", "label": "EKO DIESEL"}],
                    "LUKOIL": [{"id": "regular", "label": "Regular"}, {"id": "premium", "label": "Premium"}, {"id": "diesel", "label": "Diesel"}],
                    "ROMPETROL": [{"id": "regular", "label": "Regular"}, {"id": "premium", "label": "Premium"}, {"id": "diesel", "label": "Diesel"}]
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
    db = get_session()
    
    # Проверяем, есть ли уже цены
    count = db.query(PriceUpdate).count()
    if count > 0:
        print(f"✓ В БД уже есть {count} записей цен")
        db.close()
        return
    
    # Получаем все станции
    stations = db.query(Station).all()
    
    try:
        added = 0
        for station in stations:
            if station.fuel_config:
                fuel_list = json.loads(station.fuel_config)
                for fuel in fuel_list:
                    fuel_id = fuel.get('id')
                    if fuel_id:
                        # Генерируем случайную цену в разумных пределах
                        import random
                        if 'super' in fuel_id or 'premium' in fuel_id:
                            price = round(random.uniform(3.10, 3.30), 2)
                        elif 'regular' in fuel_id:
                            price = round(random.uniform(2.90, 3.10), 2)
                        elif 'diesel' in fuel_id:
                            price = round(random.uniform(2.95, 3.15), 2)
                        else:
                            price = round(random.uniform(2.80, 3.20), 2)
                        
                        price_update = PriceUpdate(
                            station_id=station.id,
                            fuel_type=fuel_id,
                            price=price,
                            timestamp=datetime.datetime.utcnow(),
                            source="init_data"
                        )
                        db.add(price_update)
                        added += 1
        
        db.commit()
        print(f"✓ Добавлено {added} записей цен для {len(stations)} станций")
    except Exception as e:
        db.rollback()
        print(f"✗ Ошибка при добавлении цен: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

# === ИНИЦИАЛИЗАЦИЯ ИНФОРМАЦИИ О САЙТЕ ===
# def init_site_info():
#     db = get_session()
#     
#     # Проверяем, есть ли уже инфо
#     count = db.query(SiteInfo).count()
#     if count > 0:
#         print(f"✓ В БД уже есть {count} записей о сайте")
#         db.close()
#         return
#     
#     site_data = [
#         ("app_title", "Cheap Gasoline - Лучшие цены на топливо в Грузии", "Название приложения"),
#         ("app_description", "Найдите ближайшую АЗС с лучшими ценами на бензин и дизель", "Описание приложения"),
#         ("support_email", "support@cheapgasoline.ge", "Email поддержки"),
#         ("currency", "GEL", "Валюта"),
#         ("default_city", "Tbilisi", "Город по умолчанию"),
#     ]
#     
#     try:
#         for key, value, description in site_data:
#             site_info = SiteInfo(
#                 key=key,
#                 value=value,
#                 description=description,
#                 updated_at=datetime.datetime.utcnow()
#             )
#             db.add(site_info)
#         
#         db.commit()
#         print(f"✓ Добавлено {len(site_data)} записей о сайте")
#     except Exception as e:
#         db.rollback()
#         print(f"✗ Ошибка при добавлении информации о сайте: {e}")
#     finally:
#         db.close()

# === ИНИЦИАЛИЗАЦИЯ СУПЕРАДМИНА ===
def init_superadmin():
    db = get_session()
    
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
    # init_site_info()  # Закомментировано, так как модель SiteInfo не используется
    print("=" * 50)
    print("✓ Инициализация завершена!")
    print("=" * 50)
