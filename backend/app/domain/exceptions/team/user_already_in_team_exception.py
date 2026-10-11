from typing import Optional

from app.domain.exceptions.domain_exception import DomainException

class UserAlreadyInTeamException(DomainException):
    """Exception raised when a user is already in a team."""

    def __init__(self, user_id: int, team_id: Optional[int] = None):
        if team_id is None:
            super().__init__(f"El usuario con id: {user_id} ya forma parte de un equipo activo", 409)
        else:
            super().__init__(f"El usuario con id: {user_id} ya está en el equipo con id: {team_id}", 409)
