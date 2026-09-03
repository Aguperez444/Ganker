from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from pathlib import Path


# obtiene la ruta absoluta del directorio donde se encuentra este archivo settings.py y luego sube 1 nivel para llegar a la carpeta config
CONFIG_DIR = Path(__file__).resolve().parent
# Sube 4 niveles: config -> infrastructure -> app -> raíz del proyecto
BASE_DIR = CONFIG_DIR.parent.parent.parent

class Settings(BaseSettings):
    jwt_secret_key: str

    # Si se define UPLOAD_DIR en el entorno/Docker, toma esa ruta; si no, usa la carpeta media local
    media_dir: Path = Field(default_factory=lambda: BASE_DIR / "media", validation_alias="UPLOAD_DIR")
    media_url: str = Field(default="/media", validation_alias="MEDIA_URL")

    model_config = SettingsConfigDict(
        env_file=CONFIG_DIR / "secrets.env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()