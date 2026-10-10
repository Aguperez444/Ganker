from app.domain.exceptions.domain_exception import DomainException


class TeamNotFoundException(DomainException):
    """Exception raised when a team is not found."""

    def __init__(self, team_id: int):
        super().__init__(f"No se encontró el equipo con id: {team_id}", 404)
