from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    jwt_secret_key: str

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / "secrets.env",
        env_file_encoding="utf-8",
    )


settings = Settings()