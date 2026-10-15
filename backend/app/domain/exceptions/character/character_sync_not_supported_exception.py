from app.domain.exceptions.domain_exception import DomainException


class CharacterSyncNotSupportedException(DomainException):
    def __init__(self, videogame_name: str):
        super().__init__(
            message=f"El videojuego '{videogame_name}' no admite la importación automática de personajes. "
                    f"Sus personajes se cargan manualmente.",
            status_code=400
        )
