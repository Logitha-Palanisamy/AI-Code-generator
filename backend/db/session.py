from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.core.config import settings

# Check if we are running SQLite to apply check_same_thread rules
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Create the SQLAlchemy Engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

# Session factory for generating db sessions
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)
