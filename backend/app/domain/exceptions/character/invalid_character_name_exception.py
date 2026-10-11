from app.domain.exceptions.domain_exception import DomainException


class InvalidCharacterNameException(DomainException):
    def __init__ (self, name: str):
        super().__init__(message=f'El nombre de personaje "{name}" es inválido.', status_code=400)