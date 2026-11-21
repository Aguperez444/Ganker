from app.domain.exceptions.domain_exception import DomainException


class BanReferenceNotOwnedException(DomainException):
    def __init__(self):
        super().__init__(
            message="El baneo de referencia no pertenece a este jugador.",
            status_code=404,
        )
