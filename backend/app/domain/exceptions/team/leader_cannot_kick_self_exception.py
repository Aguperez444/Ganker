from app.domain.exceptions.domain_exception import DomainException


class LeaderCannotKickSelfException(DomainException):
    def __init__(self, team_id: int):
        super().__init__("El líder del equipo no puede autoexpulsarse del equipo.", 400)
