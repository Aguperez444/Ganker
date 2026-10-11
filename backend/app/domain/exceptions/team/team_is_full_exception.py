from app.domain.exceptions.domain_exception import DomainException



class TeamIsAlreadyFullException(DomainException):
    """Exception raised when a team is full."""

    def __init__(self, team_id: int):
        super().__init__(f"El equipo con id: {team_id} está completo, no pueden unirse más usuarios", 400)