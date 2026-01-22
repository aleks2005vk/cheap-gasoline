from sqlmodel import SQLModel, create_engine, Session
from typing import Optional
import os

# Default to SQLite for development. Can override with BACKEND_DATABASE_URL env var.
# PostgreSQL examples:
#   postgresql://user:password@localhost/cheap_gasoline
#   postgresql+psycopg2://user:password@localhost/cheap_gasoline
# SQLite example:
#   sqlite:///backend/cheap_gasoline.db

DATABASE_URL = os.environ.get("BACKEND_DATABASE_URL")

# If not set, use SQLite as default
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./backend/cheap_gasoline.db"
elif "postgresql" in DATABASE_URL and "psycopg2" not in DATABASE_URL:
    # For SQLAlchemy + psycopg2 with PostgreSQL, ensure the URL has the right scheme
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://")

engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})

def init_db():
    # Import models in a way that works when this package is imported
    # as a package or when running scripts that add the backend folder to sys.path.
    try:
        import models  # type: ignore
    except Exception:
        from . import models  # type: ignore
    SQLModel.metadata.create_all(engine)

def get_session() -> Session:
    return Session(engine)
