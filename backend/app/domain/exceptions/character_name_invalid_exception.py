from app.domain.exceptions.domain_exception import DomainException


class CharacterNameInvalidException(DomainException):
    def __init__ (self, name: str):
        super().__init__(message=f'The character name "{name}" is invalid.', status_code=400)