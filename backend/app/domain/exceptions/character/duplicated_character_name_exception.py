from app.domain.exceptions.domain_exception import DomainException


class DuplicatedCharacterNameException(DomainException):
    def __init__(self, name: str, videogame_id: int):
        super().__init__(f"Ya existe un personaje con el nombre '{name}' en el videojuego con ID {videogame_id}.",
                         status_code=409)