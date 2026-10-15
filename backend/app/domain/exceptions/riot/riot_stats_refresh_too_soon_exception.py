from app.domain.exceptions.domain_exception import DomainException


class RiotStatsRefreshTooSoonException(DomainException):
    def __init__(self, seconds_left: int):
        minutes = max(1, -(-seconds_left // 60))
        super().__init__(
            message=f"Las estadísticas se actualizaron hace poco. Podés volver a actualizarlas en {minutes} "
                    f"minuto{'s' if minutes != 1 else ''}.",
            status_code=429
        )
