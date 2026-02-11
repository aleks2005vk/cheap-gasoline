import sqlite3
import os

def inspect_db(path):
    print('---', path)
    if not os.path.exists(path):
        print('MISSING')
        return
    try:
        conn = sqlite3.connect(path)
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='station'")
        if not cur.fetchone():
            print('No table `station`')
            return
        cur.execute('SELECT COUNT(*) FROM station')
        print('station count:', cur.fetchone()[0])
    except Exception as e:
        print('ERROR:', e)

inspect_db('cheap_gasoline.db')
inspect_db('backend/cheap_gasoline.db')
inspect_db('backend/cheap_gasoline.db')
