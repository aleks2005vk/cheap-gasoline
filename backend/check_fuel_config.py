from database import get_session
db = get_session()
result = db.exec('SELECT COUNT(*) FROM station WHERE fuel_config IS NULL OR fuel_config = ""')
count = result.scalar()
print('Stations with empty fuel_config:', count)
db.close()