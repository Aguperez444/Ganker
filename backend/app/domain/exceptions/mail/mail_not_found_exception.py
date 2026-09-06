from app.domain.exceptions.domain_exception import DomainException


class EmailNotFoundException(DomainException):
    def __init__(self, email: str):
        super().__init__(
            message=f"No se encontró ninguna cuenta registrada con el email {email}.",
            status_code=404
        )
