from app.domain.exceptions.domain_exception import DomainException


class RiotAccountWithoutGameException(DomainException):
    def __init__(self, riot_id: str, videogame_name: str):
        super().__init__(
            message=f"La cuenta de Riot '{riot_id}' no registra partidas de {videogame_name}.",
            status_code=404
        )
