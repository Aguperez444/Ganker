from app.domain.exceptions.domain_exception import DomainException


class VideogameNotFoundException(DomainException):
    def __init__(self, videogame_id: int):
        super().__init__(
            message=f'El videojuego con id {videogame_id} no fue encontrado.',
            status_code=404
        )