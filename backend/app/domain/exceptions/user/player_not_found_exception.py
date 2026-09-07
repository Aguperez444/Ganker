from app.domain.exceptions.domain_exception import DomainException


class PlayerNotFoundException(DomainException):
    def __init__(self, player_id: int):
        super().__init__(
            message=f'No se encontró un jugador con el ID {player_id}.',
            status_code=404
        )