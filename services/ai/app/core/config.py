from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "KoperasiLink AI Rule Engine"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/koperasilink"

    # AI Engine
    DEFAULT_MARGIN_RATE: float = 0.20
    SHIPPING_COST_PER_KM_KG: float = 500.0

    # CORS
    ALLOWED_ORIGINS: list[str] = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
