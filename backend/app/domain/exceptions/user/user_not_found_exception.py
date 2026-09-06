from app.domain.exceptions.domain_exception import DomainException


class UserNotFoundException(DomainException):
    def __init__(self):
        super().__init__(
            message=f"No se encontró ninguna cuenta registrada con sus datos.",
            status_code=404
        )
