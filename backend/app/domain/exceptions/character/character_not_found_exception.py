from app.domain.exceptions.domain_exception import DomainException


class CharacterNotFoundException(DomainException):
    def __init__(self, character_id: int):
        super().__init__(
            message=f'El personaje con id {character_id} no fue encontrado.',
            status_code=404
        )