import json
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


def _parse_csv_or_json_list(raw: str) -> List[str]:
    value = raw.strip()
    if not value:
        return []
    if value.startswith("["):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return [str(item).strip() for item in parsed if str(item).strip()]
        except json.JSONDecodeError:
            inner = value.strip("[]").strip()
            if inner:
                return [part.strip() for part in inner.split(",") if part.strip()]
    if "," in value:
        return [part.strip() for part in value.split(",") if part.strip()]
    return [value]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "SmartDoc Analyzer"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = "postgresql://smartdoc:smartdoc@localhost:5432/smartdoc"
    REDIS_URL: str = "redis://localhost:6379/0"

    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7

    SPACY_MODEL: str = "en_core_web_sm"
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 25
    ALLOWED_EXTENSIONS: str = "pdf,png,jpg,jpeg,tiff,bmp,webp"
    CACHE_TTL_SECONDS: int = 86400

    # Stored as plain string so Railway env vars don't need strict JSON quoting.
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return _parse_csv_or_json_list(self.CORS_ORIGINS)

    @property
    def allowed_extensions_list(self) -> List[str]:
        return _parse_csv_or_json_list(self.ALLOWED_EXTENSIONS)


@lru_cache
def get_settings() -> Settings:
    return Settings()
