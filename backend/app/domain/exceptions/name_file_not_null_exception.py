from app.domain.exceptions.domain_exception import DomainException


class NameFileNotNullException(DomainException):
    def __init__(self):
        super().__init__(
            message="El archivo de ícono debe tener un nombre válido.",
            status_code=400
        )