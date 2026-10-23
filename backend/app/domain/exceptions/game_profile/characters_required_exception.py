from app.domain.exceptions.domain_exception import DomainException


class CharactersRequiredException(DomainException):
    def __init__(self):
        super().__init__(
            "Debe seleccionar al menos un personaje para un videojuego con personajes.",
            status_code=422,
        )
