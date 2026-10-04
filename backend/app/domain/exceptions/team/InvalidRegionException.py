from app.domain.exceptions.domain_exception import DomainException


class InvalidRegionException(DomainException):
    """Raised when a role is already occupied in a team."""

    def __init__(self, region_id: int, team_id: int):
        super().__init__(f"El equipo {team_id} no permite jugadores de la region {region_id}", 400)
