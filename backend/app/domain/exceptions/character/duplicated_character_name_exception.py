from app.domain.exceptions.domain_exception import DomainException


class DuplicatedCharacterNameException(DomainException):
    def __init__(self, name: str, videogame_id: int):
        super().__init__(f"Character with name '{name}' already exists in videogame with ID {videogame_id}.",
                         status_code=409)