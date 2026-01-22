"""Import `points.js` entries into the backend SQLite database.

Usage:
  python backend/import_points.py

This script runs the Node exporter to produce JSON and then inserts stations into the DB.
"""
import json
import subprocess
import os
import sys

HERE = os.path.dirname(__file__)
NODE_EXPORT = os.path.join(HERE, 'export_points.mjs')

def get_points_json():
    cmd = ['node', NODE_EXPORT]
    proc = subprocess.run(cmd, cwd=HERE, capture_output=True, text=True)
    if proc.returncode != 0:
        print('Error running node export:', proc.stderr, file=sys.stderr)
        sys.exit(proc.returncode)
    return json.loads(proc.stdout)

def import_into_db(points):
    # Lazy import to avoid requiring DB libs unless running the import
    import sys
    sys.path.insert(0, HERE)
    from database import get_session, init_db
    from models import Station

    init_db()
    session = get_session()
    added = 0
    for p in points:
        try:
            name = p.get('name') or p.get('description') or 'Unknown'
            lat = float(p.get('lat'))
            lng = float(p.get('lng'))
        except Exception:
            continue
        station = Station(name=name, brand=p.get('name'), lat=lat, lng=lng, address=p.get('description'))
        session.add(station)
        added += 1
    session.commit()
    print(f'Imported {added} stations')

def main():
    points = get_points_json()
    import_into_db(points)

if __name__ == '__main__':
    main()
