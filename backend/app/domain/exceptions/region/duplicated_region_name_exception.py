from app.domain.exceptions.domain_exception import DomainException


class DuplicatedRegionNameException(DomainException):

    def __init__(self, name:str, videogame_id:int):
        super().__init__(
            message=f'El nombre de la region: "{name}" ya existe en el juego con ID: {videogame_id}.',
            status_code=409
        )