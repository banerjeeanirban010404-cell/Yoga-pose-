import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-me-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # SQLite database URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./yoga_pose_ai.db")

    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",  # React local dev server
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:3000",
    ]

    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()
