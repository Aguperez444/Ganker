from app.domain.exceptions.domain_exception import DomainException


class EmailAlreadyExistsException(DomainException):
    def __init__(self, email: str):
        super().__init__(
            message=f"Ya existe una cuenta registrada con el email {email}.",
            status_code=409
        )
