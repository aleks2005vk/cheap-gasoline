import json
import sqlite3

# --- ТВОИ ДАННЫЕ ИЗ POINTS.JS (вставь сюда свой массив точек) ---
# Я подготовил пример на основе того, что обычно в таких файлах
points_of_interest = [
    {"brand": "Socar", "name": "ул. Пекина, 1", "lat": 41.7151, "lng": 44.787},
    {"brand": "Lukoil", "name": "пр. Агмашенебели, 150", "lat": 41.7250, "lng": 44.797},
    # Добавь сюда остальные свои точки из points.js
]

def migrate():
    # Подключаемся к твоей базе
    conn = sqlite3.connect('cheap_gasoline.db')
    cursor = conn.cursor()

    for p in points_of_interest:
        # Определяем конфиг топлива в зависимости от бренда
        fuel_config = []
        if p['brand'] == "Socar":
            fuel_config = [{"id": "nano_95", "label": "NANO 95"}, {"id": "nano_92", "label": "NANO 92"}, {"id": "nano_diesel", "label": "NANO DT"}, {"id": "lpg", "label": "LPG"}]
        elif p['brand'] == "Lukoil":
            fuel_config = [{"id": "ecto_100", "label": "100 ECTO"}, {"id": "ecto_95", "label": "95 ECTO"}, {"id": "ecto_92", "label": "92 ECTO"}, {"id": "ecto_diesel", "label": "ED ECTO"}]
        # ... можно добавить для других брендов

        try:
            cursor.execute("""
                INSERT INTO station (brand, name, lat, lng, fuel_config)
                VALUES (?, ?, ?, ?, ?)
            """, (p['brand'], p['name'], p['lat'], p['lng'], json.dumps(fuel_config)))
            print(f"Добавлена точка: {p['name']}")
        except Exception as e:
            print(f"Ошибка при добавлении {p['name']}: {e}")

    conn.commit()
    conn.close()
    print("Миграция завершена!")

if __name__ == "__main__":
    migrate()