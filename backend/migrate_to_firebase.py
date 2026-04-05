"""
Миграция пользователей в Firebase Auth
Запуск: python migrate_to_firebase.py
"""

import firebase_admin
from firebase_admin import auth, credentials
from sqlmodel import Session, select
from database import get_session
from models import User

# Инициализация Firebase (убедись, что ключ есть)
cred = credentials.Certificate("firebase-service-account.json")
firebase_admin.initialize_app(cred)

def migrate_users():
    db = next(get_session())
    users = db.exec(select(User)).all()

    for user in users:
        try:
            # Создать пользователя в Firebase
            firebase_user = auth.create_user(
                email=user.email,
                display_name=user.name,
                disabled=user.is_banned
            )
            print(f"✅ Migrated: {user.email} -> {firebase_user.uid}")
        except Exception as e:
            print(f"⚠️ Failed: {user.email} - {e}")

    db.close()
    print("Миграция завершена. Пользователи могут восстановить пароли через Firebase.")

if __name__ == "__main__":
    migrate_users()