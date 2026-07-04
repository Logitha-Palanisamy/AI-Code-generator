import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.db.base import Base
from backend.core.dependencies import get_db
from backend.main import app

# Import all models to ensure they register on the Base class metadata for testing
from backend.models.user import User
from backend.models.project import Project
from backend.models.pipeline import PipelineRun
from backend.models.setting import Setting
from backend.models.ai_usage import AIUsageLog

# In-memory SQLite connection string for ultra-fast, isolated testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

from sqlalchemy.pool import StaticPool

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(name="db")
def fixture_db():
    """Sets up and tears down an ephemeral test database schema for each test."""
    print("Base metadata tables:", list(Base.metadata.tables.keys()))
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(name="client")
def fixture_client(db):
    """Provides a TestClient with overridden get_db dependencies."""
    def override_get_db():
        try:
            yield db
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
