from app.domain.exceptions.domain_exception import DomainException


class InvalidVideogameNameException(DomainException):
    def __init__(self, name: str):
        super().__init__(
            message=f"El nombre: '{name}' es inválido o usa caracteres inválidos.",
            status_code=400
        )
