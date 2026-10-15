from app.domain.exceptions.domain_exception import DomainException


class DiscordNotConfiguredException(DomainException):
    def __init__(self):
        super().__init__(
            message="El servidor no tiene configurada la aplicación de Discord "
                    "(DISCORD_CLIENT_ID y DISCORD_CLIENT_SECRET en secrets.local.env).",
            status_code=503
        )
