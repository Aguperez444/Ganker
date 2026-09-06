from app.domain.exceptions.domain_exception import DomainException


class VideogameNotFoundException(DomainException):
    def __init__(self, videogame_id: int):
        super().__init__(
            message=f'The videogame with id {videogame_id} was not found.',
            status_code=404
        )