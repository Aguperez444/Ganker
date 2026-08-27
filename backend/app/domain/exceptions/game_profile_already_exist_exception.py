from app.domain.exceptions.domain_exception import DomainException


class GameProfileAlreadyExistException(DomainException):
    def __init__(self, player_id: int, videogame_id: int):
        super().__init__(
            message=f'The player with id {player_id} already has a profile created for the videogame with id {videogame_id}.',
            status_code=400
        )