from app.domain.exceptions.domain_exception import DomainException


class DiscordApiUnavailableException(DomainException):
    def __init__(self):
        super().__init__(
            message="No se pudo conectar con Discord. Intentá de nuevo más tarde.",
            status_code=502
        )
