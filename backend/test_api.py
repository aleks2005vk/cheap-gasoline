from database import get_session
from models import Station, PriceUpdate
from sqlmodel import select
import json

db = get_session()
try:
    stations = db.exec(select(Station)).all()
    print(f"Found {len(stations)} stations")
    result = []
    for i, station in enumerate(stations[:5]):  # Проверим первые 5
        print(f"Processing station {i+1}: {station.name}")
        prices_data = []
        if station.fuel_config:
            fuel_list = json.loads(station.fuel_config)
            print(f"  fuel_list: {fuel_list}")
            for fuel in fuel_list:
                print(f"  Checking fuel: {fuel.get('id')}")
                last_price = db.exec(select(PriceUpdate).where(
                    PriceUpdate.station_id == station.id,
                    PriceUpdate.fuel_type == fuel.get('id')
                ).order_by(PriceUpdate.created_at.desc())).first()
                prices_data.append({
                    "id": fuel.get('id'),
                    "type": fuel.get('label'),
                    "price": float(last_price.price) if last_price else None
                })
        result.append({
            "id": station.id, "name": station.name, "brand": station.brand,
            "lat": station.lat, "lng": station.lng, "prices": prices_data
        })
    print("Success!")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()