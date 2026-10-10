from app.domain.exceptions.domain_exception import DomainException


class LeaderCannotLeaveTeamException(DomainException):
    def __init__(self, team_id: int):
        super().__init__("El líder del equipo no puede salir directamente. Debe transferir el liderazgo o eliminar el equipo.", 400)
