from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import User, UsersBase # Импортируем модель User из твоего файла

# Подключаемся к базе пользователей (путь как в твоем коде)
USERS_DB_URL = "sqlite:///./data/users.db"
engine = create_engine(USERS_DB_URL)
SessionLocal = sessionmaker(bind=engine)

def give_admin_rights(email):
    db = SessionLocal()
    # Ищем тебя по email
    user = db.query(User).filter(User.email == email).first()
    
    if user:
        user.is_admin = True
        user.role = "superadmin" # Даем максимальную роль
        db.commit()
        print(f"--- УСПЕХ ---")
        print(f"Пользователь {email} теперь имеет права администратора.")
    else:
        print(f"--- ОШИБКА ---")
        print(f"Пользователь с email '{email}' не найден в базе.")
    
    db.close()

if __name__ == "__main__":
    # ВПИШИ СЮДА СВОЙ EMAIL, под которым ты регистрировался в приложении
    my_email = "aleksvk22@gmail.com" 
    give_admin_rights(my_email)