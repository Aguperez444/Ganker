from app.domain.exceptions.domain_exception import DomainException


class RiotStatsNotAvailableException(DomainException):
    def __init__(self, videogame_name: str):
        super().__init__(
            message=f"Riot no permite consultar las estadísticas de {videogame_name}: la cuenta queda vinculada, "
                    f"pero no hay datos para actualizar.",
            status_code=400
        )
