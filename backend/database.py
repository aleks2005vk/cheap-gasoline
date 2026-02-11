import os
from sqlmodel import SQLModel, create_engine, Session
from typing import Optional

# Определяем путь к папке backend
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Путь к базе данных
db_path = os.path.join(BASE_DIR, "cheap_gasoline.db")
DATABASE_URL = f"sqlite:///{db_path}"

# check_same_thread=False нужен для SQLite
engine = create_engine(
    DATABASE_URL, 
    echo=False, 
    connect_args={"check_same_thread": False}
)

def init_db():
    import models  # Импорт внутри функции, чтобы избежать круговых зависимостей
    SQLModel.metadata.create_all(engine)
    print(f"База данных инициализирована по адресу: {db_path}")

def get_session() -> Session:
    return Session(engine)