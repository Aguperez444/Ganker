from app.domain.exceptions.domain_exception import DomainException


class RoleAlreadyOcupiedException(DomainException):
    """Raised when a role is already occupied in a team."""

    def __init__(self, role_id: int, team_id: int):
        super().__init__(f"El rol con ID {role_id} ya está ocupado en el equipo con ID {team_id}.", 409)
