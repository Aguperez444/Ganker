from app.domain.exceptions.domain_exception import DomainException


class GameProfileNotFoundException(DomainException):
    def __init__(self, game_profile_id: int):
        super().__init__(
            message=f'El perfil de juego con id {game_profile_id} no fue encontrado.',
            status_code=404
        )