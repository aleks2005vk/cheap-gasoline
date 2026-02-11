import sqlite3

def wipe_prices():
    conn = sqlite3.connect('cheap_gasoline.db')
    cursor = conn.cursor()
    
    # Удаляем все записи о ценах
    cursor.execute("DELETE FROM priceupdate")
    conn.commit()
    conn.close()
    print("🧹 Все цены удалены! Теперь на карте будут прочерки '—', пока ты не введешь новые.")

if __name__ == "__main__":
    wipe_prices()