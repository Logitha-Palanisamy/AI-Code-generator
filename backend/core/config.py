from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union
import json

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Code Generation Agent"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "default-dev-secret-key-replace-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # DB URL - defaults to local SQLite file
    DATABASE_URL: str = "sqlite:///./app.db"
    
    # Redis URL for Celery and WebSocket caching
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # CORS origins to allow client connections
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    
    # Anthropic API Key for LLM operations
    ANTHROPIC_API_KEY: str = ""
    
    # Sandbox Settings
    SANDBOX_TIMEOUT_SECONDS: int = 60
    SANDBOX_MAX_MEM_MB: int = 512
    SANDBOX_MAX_CPUS: int = 1

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
