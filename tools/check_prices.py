import sqlite3
import json

conn = sqlite3.connect('cheap_gasoline.db')
cursor = conn.cursor()

# Check recent stations
cursor.execute('SELECT id, name, brand, lat, lng, fuel_config FROM station WHERE id IN (27, 28, 29, 30)')
stations = cursor.fetchall()

for station in stations:
    print(f'\n=== Station {station[0]}: {station[1]} ({station[2]}) ===')
    print(f'Fuel config: {station[5]}')
    
    # Check its prices
    cursor.execute('SELECT fuel_type, price, timestamp FROM priceupdate WHERE station_id = ? ORDER BY timestamp DESC LIMIT 5', (station[0],))
    prices = cursor.fetchall()
    print(f'Latest prices:')
    if prices:
        for p in prices:
            print(f'  {p[0]}: {p[1]} (at {p[2]})')
    else:
        print('  No prices found')

conn.close()
