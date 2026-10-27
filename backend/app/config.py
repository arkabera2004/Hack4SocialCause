"""Application settings loaded from environment / .env, with safe defaults."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./teestaguard.db"
    weather_mode: str = "live"  # live | offline
    weather_cache_minutes: int = 30
    weather_timeout_seconds: int = 8
    admin_token: str = "change-me-demo"
    cors_origins: str = "http://localhost:5173"
    upload_dir: str = "./uploads"
    max_upload_mb: int = 5
    sample_data_dir: str = "../sample-data"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
