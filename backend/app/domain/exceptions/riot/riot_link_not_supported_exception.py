from app.domain.exceptions.domain_exception import DomainException


class RiotLinkNotSupportedException(DomainException):
    def __init__(self, videogame_name: str):
        super().__init__(
            message=f"No se puede vincular una cuenta de Riot a un perfil de {videogame_name}. "
                    f"Por ahora solo está disponible para League of Legends y Valorant.",
            status_code=400
        )
