from app.domain.exceptions.domain_exception import DomainException


class RiotServerRequiredException(DomainException):
    def __init__(self, videogame_name: str):
        super().__init__(
            message=f"Elegí el servidor de tu cuenta de {videogame_name}.",
            status_code=400
        )
