from app.domain.exceptions.domain_exception import DomainException


class CharacterNotFoundException(DomainException):
    def __init__(self, character_id: int):
        super().__init__(
            message=f'Character with id {character_id} not found.',
            status_code=404
        )