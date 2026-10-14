from app.domain.exceptions.domain_exception import DomainException


class DiscordAccountAlreadyLinkedException(DomainException):
    def __init__(self, username: str):
        super().__init__(
            message=f"La cuenta de Discord '{username}' ya está vinculada a otro jugador de Ganker.",
            status_code=409
        )
