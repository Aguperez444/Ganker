from app.domain.exceptions.domain_exception import DomainException


class ExpireResetTokenException(DomainException):
    def __init__(self):
        super().__init__(
            message="Enlace expirado.",
            status_code=400
        )