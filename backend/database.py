import os
from sqlmodel import SQLModel, create_engine, Session
from typing import Optional
from dotenv import load_dotenv

# Определяем путь к папке backend
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

# Если DATABASE_URL задан через окружение, используем его.
# Иначе — локальный SQLite для быстрого запуска.
default_db_path = os.path.join(BASE_DIR, "cheap_gasoline.db")
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{default_db_path}")

engine_kwargs = {"echo": False}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_kwargs)

def init_db():
    import models  # Импорт внутри функции, чтобы избежать круговых зависимостей
    SQLModel.metadata.create_all(engine)
    print(f"База данных инициализирована: {DATABASE_URL}")

def get_session() -> Session:
    return Session(engine)