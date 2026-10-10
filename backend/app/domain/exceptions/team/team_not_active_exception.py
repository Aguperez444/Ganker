from app.domain.exceptions.domain_exception import DomainException


class TeamNotActiveException(DomainException):
    """Raised when trying to join a team that is no longer active."""

    def __init__(self, team_id: int):
        super().__init__(f"El equipo con id: {team_id} ya no está activo", 409)
