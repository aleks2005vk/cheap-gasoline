"""Helper to inspect the backend database (SQLite or PostgreSQL).

Usage examples (from project root):
  # SQLite (default)
  backend\.venv\Scripts\python.exe backend/db_inspect.py

  # PostgreSQL (set env var first)
  $env:BACKEND_DATABASE_URL = "postgresql://postgres:password@localhost:5432/cheap_gasoline"
  backend\.venv\Scripts\python.exe backend/db_inspect.py

This prints available tables, the Station count and a 10-row sample.
"""
import os
import sys
import json

# Try importing sqlmodel / database module
sys.path.insert(0, os.path.dirname(__file__))

try:
    from database import engine
    from sqlmodel import Session, select
    from models import Station
except ImportError as e:
    print(f"Error importing database/models: {e}")
    sys.exit(1)

def inspect_db():
    try:
        with Session(engine) as session:
            # Count stations
            stmt = select(Station)
            stations = session.exec(stmt).all()
            count = len(stations)
            print(f'Station count: {count}')
            
            # Sample 10
            if count > 0:
                sample = session.exec(select(Station).limit(10)).all()
                print('\nSample stations (up to 10):')
                for s in sample:
                    print(json.dumps({
                        'id': s.id,
                        'name': s.name,
                        'brand': s.brand,
                        'lat': s.lat,
                        'lng': s.lng,
                        'address': s.address
                    }, ensure_ascii=False))
            else:
                print('No stations found.')
    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    inspect_db()

