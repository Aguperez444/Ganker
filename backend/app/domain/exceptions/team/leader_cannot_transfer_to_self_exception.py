from app.domain.exceptions.domain_exception import DomainException


class LeaderCannotTransferToSelfException(DomainException):
    def __init__(self, team_id: int):
        super().__init__("El líder del equipo no puede transferir el liderazgo a sí mismo.", 400)
