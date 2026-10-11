from app.domain.exceptions.domain_exception import DomainException


class UserNotTeamLeaderException(DomainException):
    def __init__(self, user_id: int, team_id: int):
        super().__init__(f"El usuario con ID {user_id} no es el líder del equipo con ID {team_id}.", 403)
