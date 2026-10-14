from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from pathlib import Path


# obtiene la ruta absoluta del directorio donde se encuentra este archivo settings.py y luego sube 1 nivel para llegar a la carpeta config
CONFIG_DIR = Path(__file__).resolve().parent
# Sube 4 niveles: config -> infrastructure -> app -> raíz del proyecto
BASE_DIR = CONFIG_DIR.parent.parent.parent
DB_DIR = BASE_DIR / "app" / "infrastructure" / "database"

class Settings(BaseSettings):
    jwt_secret_key: str

    # Si se define DATABASE_URL en el entorno o Docker, usa esa; si no, apunta al sqlite local
    database_url: str = Field(
        default_factory=lambda: f"sqlite:///{DB_DIR / 'db.db'}",
        validation_alias="DATABASE_URL",
    )

    # Si se define UPLOAD_DIR en el entorno/Docker, toma esa ruta; si no, usa la carpeta media local
    media_dir: Path = Field(default_factory=lambda: BASE_DIR / "media", validation_alias="UPLOAD_DIR")
    media_url: str = Field(default="/media", validation_alias="MEDIA_URL")

    login_rate_limit_enabled: bool = Field(default=True, validation_alias="LOGIN_RATE_LIMIT_ENABLED")
    login_rate_limit_max_attempts: int = Field(default=5, validation_alias="LOGIN_RATE_LIMIT_MAX_ATTEMPTS")
    login_rate_limit_window_seconds: int = Field(default=60, validation_alias="LOGIN_RATE_LIMIT_WINDOW_SECONDS")

    # Data Dragon: API pública y oficial de Riot Games con los campeones de League of Legends (no requiere API key)
    riot_ddragon_base_url: str = Field(default="https://ddragon.leagueoflegends.com", validation_alias="RIOT_DDRAGON_BASE_URL")
    riot_ddragon_locale: str = Field(default="es_AR", validation_alias="RIOT_DDRAGON_LOCALE")
    external_catalog_timeout_seconds: float = Field(default=10.0, validation_alias="EXTERNAL_CATALOG_TIMEOUT_SECONDS")

    model_config = SettingsConfigDict(
        env_file=CONFIG_DIR / "secrets.env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()