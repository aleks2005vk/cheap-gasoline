#!/usr/bin/env python3
"""
Скрипт для управления ролями пользователей через Firebase Custom Claims
Использование: python set_role.py <firebase_uid> <role>
"""

import sys
import os
import firebase_admin
from firebase_admin import auth, credentials

def init_firebase():
    """Инициализация Firebase"""
    try:
        # Путь к сервисному аккаунту
        service_account_path = os.path.join(os.path.dirname(__file__), "firebase-service-account.json")

        if not os.path.exists(service_account_path):
            print("❌ Ошибка: файл firebase-service-account.json не найден!")
            print("   Поместите его в папку backend/")
            sys.exit(1)

        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
        print("✅ Firebase инициализирован")
        return True
    except Exception as e:
        print(f"❌ Ошибка инициализации Firebase: {e}")
        return False

def set_user_role(firebase_uid: str, role: str):
    """Установить роль пользователю"""
    try:
        # Валидация роли
        valid_roles = ["admin", "moderator", "station_owner", "user", "guest"]
        if role not in valid_roles:
            print(f"❌ Недопустимая роль. Допустимые роли: {', '.join(valid_roles)}")
            return False

        # Установить Custom Claims
        auth.set_custom_user_claims(firebase_uid, {"role": role})
        print(f"✅ Роль '{role}' успешно назначена пользователю {firebase_uid}")
        return True

    except Exception as e:
        print(f"❌ Ошибка при установке роли: {e}")
        return False

def get_user_role(firebase_uid: str):
    """Получить роль пользователя"""
    try:
        user = auth.get_user(firebase_uid)
        custom_claims = user.custom_claims or {}
        role = custom_claims.get("role", "user")

        print(f"👤 Пользователь: {user.email}")
        print(f"🔑 Firebase UID: {firebase_uid}")
        print(f"👑 Роль: {role}")
        print(f"📧 Email подтвержден: {user.email_verified}")
        print(f"🚫 Заблокирован: {user.disabled}")

        return role

    except Exception as e:
        print(f"❌ Ошибка при получении роли: {e}")
        return None

def list_users():
    """Показать всех пользователей"""
    try:
        print("📋 Список пользователей:")
        print("-" * 80)

        users = auth.list_users()
        for user in users.iterate_all():
            custom_claims = user.custom_claims or {}
            role = custom_claims.get("role", "user")
            print("15")

        print("-" * 80)
        print(f"📊 Всего пользователей: {len(list(auth.list_users().iterate_all()))}")

    except Exception as e:
        print(f"❌ Ошибка при получении списка пользователей: {e}")

def main():
    if len(sys.argv) < 2:
        print("🔧 Использование:")
        print("  python set_role.py list                    # Показать всех пользователей")
        print("  python set_role.py get <firebase_uid>      # Получить роль пользователя")
        print("  python set_role.py set <firebase_uid> <role>  # Установить роль")
        print("")
        print("📋 Допустимые роли: admin, moderator, station_owner, user, guest")
        print("")
        print("💡 Как найти Firebase UID:")
        print("  1. Зайдите в Firebase Console")
        print("  2. Authentication → Users")
        print("  3. Нажмите на пользователя")
        print("  4. Скопируйте UID")
        return

    command = sys.argv[1].lower()

    # Инициализация Firebase
    if not init_firebase():
        return

    if command == "list":
        list_users()

    elif command == "get":
        if len(sys.argv) < 3:
            print("❌ Укажите Firebase UID: python set_role.py get <firebase_uid>")
            return
        firebase_uid = sys.argv[2]
        get_user_role(firebase_uid)

    elif command == "set":
        if len(sys.argv) < 4:
            print("❌ Укажите Firebase UID и роль: python set_role.py set <firebase_uid> <role>")
            return
        firebase_uid = sys.argv[2]
        role = sys.argv[3]
        set_user_role(firebase_uid, role)

    else:
        print(f"❌ Неизвестная команда: {command}")
        print("Используйте: list, get, или set")

if __name__ == "__main__":
    main()