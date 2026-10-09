from app.domain.exceptions.domain_exception import DomainException



class TeamMemberSlotNotFoundException(DomainException):
    """Raised when a team member slot is not found."""

    def __init__(self, slot_id: int, team_id: int):
        super().__init__(f"El slot con ID {slot_id} no existe en el equipo con ID {team_id}.", 404)
