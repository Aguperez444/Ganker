from app.domain.exceptions.domain_exception import DomainException


class RiotAccountNotLinkedException(DomainException):
    def __init__(self, game_profile_id: int):
        super().__init__(
            message=f"El perfil de juego con id {game_profile_id} no tiene una cuenta de Riot vinculada.",
            status_code=404
        )
