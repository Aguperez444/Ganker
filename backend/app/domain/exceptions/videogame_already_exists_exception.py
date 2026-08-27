from app.domain.exceptions.domain_exception import DomainException


class VideogameAlreadyExistsException(DomainException):
    def __init__(self, videogame_name: str):
        super().__init__(
            message=f"El juego: '{videogame_name}' ya existe",
            status_code=409
        )
