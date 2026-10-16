from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from pathlib import Path


# obtiene la ruta absoluta del directorio donde se encuentra este archivo settings.py y luego sube 1 nivel para llegar a la carpeta config
CONFIG_DIR = Path(__file__).resolve().parent
# Sube 4 niveles: config -> infrastructure -> app -> raíz del proyecto
BASE_DIR = CONFIG_DIR.parent.parent.parent
DB_DIR = BASE_DIR / "app" / "infrastructure" / "database"

class Settings(BaseSettings):
    # JSON Web Token (JWT) secret key para firmar y verificar tokens de autenticación
    jwt_secret_key: str

    # Conexión contra la BDD
    # Si se define DATABASE_URL en el entorno o Docker, usa esa; si no, apunta al sqlite local
    database_url: str = Field(
        default_factory=lambda: f"sqlite:///{DB_DIR / 'db.db'}",
        validation_alias="DATABASE_URL",
    )

    # Carpeta donde se guardan los archivos subidos (íconos de personajes, etc.)
    # Si se define UPLOAD_DIR en el entorno/Docker, toma esa ruta; si no, usa la carpeta media local
    media_dir: Path = Field(default_factory=lambda: BASE_DIR / "media", validation_alias="UPLOAD_DIR")
    media_url: str = Field(default="/media", validation_alias="MEDIA_URL")

    # Configuración de límites de velocidad para el login (para prevenir ataques de fuerza bruta)
    login_rate_limit_enabled: bool = Field(default=True, validation_alias="LOGIN_RATE_LIMIT_ENABLED")
    login_rate_limit_max_attempts: int = Field(default=5, validation_alias="LOGIN_RATE_LIMIT_MAX_ATTEMPTS")
    login_rate_limit_window_seconds: int = Field(default=60, validation_alias="LOGIN_RATE_LIMIT_WINDOW_SECONDS")

    # Configuración de correo por resend
    resend_api_key: str = Field(default="", validation_alias="RESEND_API_KEY")
    email_from: str = Field(default="", validation_alias="EMAIL_FROM")
    email_api_url: str = Field(default="", validation_alias="EMAIL_API_URL")

    # Configuración de correo por smtp con gmail
    smtp_host: str = Field(default="", validation_alias="SMTP_HOST")
    smtp_port: int = Field(default=0, validation_alias="SMTP_PORT")
    smtp_username: str = Field(default="", validation_alias="SMTP_USERNAME")
    smtp_password: str = Field(default="", validation_alias="SMTP_PASSWORD")
    smtp_email_from: str = Field(default="", validation_alias="SMTP_EMAIL_FROM")

    frontend_url: str = Field(
        default="http://localhost:3000", validation_alias="FRONTEND_URL"
    )

    # Data Dragon: API pública y oficial de Riot Games con los campeones de League of Legends (no requiere API key)
    riot_ddragon_base_url: str = Field(default="https://ddragon.leagueoflegends.com", validation_alias="RIOT_DDRAGON_BASE_URL")
    riot_ddragon_locale: str = Field(default="es_AR", validation_alias="RIOT_DDRAGON_LOCALE")
    external_catalog_timeout_seconds: float = Field(default=10.0, validation_alias="EXTERNAL_CATALOG_TIMEOUT_SECONDS")

    # API de Riot Games (cuentas, rangos y partidas de LoL). Requiere una clave de https://developer.riotgames.com
    # que se carga en secrets.env como RIOT_API_KEY. Sin clave, vincular una cuenta responde un error claro.
    riot_api_key: str = Field(default="", validation_alias="RIOT_API_KEY")
    riot_match_history_count: int = Field(default=10, validation_alias="RIOT_MATCH_HISTORY_COUNT")
    riot_stats_refresh_cooldown_minutes: int = Field(default=5, validation_alias="RIOT_STATS_REFRESH_COOLDOWN_MINUTES")

    # "Conectar con Discord" (OAuth2). Aplicación creada en https://discord.com/developers/applications;
    # el redirect tiene que estar cargado ahí tal cual. Client ID y Secret van en secrets.local.env.
    discord_client_id: str = Field(default="", validation_alias="DISCORD_CLIENT_ID")
    discord_client_secret: str = Field(default="", validation_alias="DISCORD_CLIENT_SECRET")
    discord_redirect_uri: str = Field(default="http://localhost:5173/app/discord/callback",
                                      validation_alias="DISCORD_REDIRECT_URI")

    model_config = SettingsConfigDict(
        # secrets.local.env (ignorado por git) pisa a secrets.env: ahí van las claves personales, como RIOT_API_KEY
        env_file=(CONFIG_DIR / "secrets.env", CONFIG_DIR / "secrets.local.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()