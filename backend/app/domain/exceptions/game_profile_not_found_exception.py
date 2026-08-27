from app.domain.exceptions.domain_exception import DomainException


class GameProfileNotFoundException(DomainException):
    def __init__(self, game_profile_id: int):
        super().__init__(
            message=f'The game profile with id {game_profile_id} was not found.',
            status_code=404
        )