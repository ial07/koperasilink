from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://koperasi:koperasi_dev@localhost:5432/koperasilink"
    api_url: str = "http://localhost:4000/api/v1"
    match_radius_km: float = 50.0
    max_recommendations: int = 10
    surplus_threshold_pct: float = 0.7   # >70% capacity = surplus
    shortage_threshold_pct: float = 0.2  # <20% capacity = shortage
    safe_reserve_pct: float = 0.15       # keep 15% as safety reserve
    shipping_cost_per_km_per_kg: float = 500.0  # IDR per km per kg
    profit_margin_pct: float = 0.20      # 20% markup

    class Config:
        env_file = ".env"


settings = Settings()
