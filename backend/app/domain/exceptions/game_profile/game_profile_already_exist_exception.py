from app.domain.exceptions.domain_exception import DomainException


class GameProfileAlreadyExistException(DomainException):
    def __init__(self, player_id: int, videogame_id: int):
        super().__init__(
            message=f'El jugador con id {player_id} ya tiene un perfil creado para el videojuego con id {videogame_id}.',
            status_code=400
        )