from app.domain.exceptions.domain_exception import DomainException


class UserNotInTeamException(DomainException):
    def __init__(self, user_id: int, team_id: int):
        super().__init__(f"El usuario con ID {user_id} no pertenece al equipo con ID {team_id}.", 400)
