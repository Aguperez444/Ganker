from app.domain.exceptions.domain_exception import DomainException


class NotBannedPlayerException(DomainException):
    def __init__ (self):
        super().__init__(message="El jugador no se encuentra baneado", status_code=400)