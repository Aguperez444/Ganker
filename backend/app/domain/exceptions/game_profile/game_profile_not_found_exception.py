from app.domain.exceptions.domain_exception import DomainException


class GameProfileNotFoundException(DomainException):
    def __init__(self, game_profile_id: int|None = None, user_id: int|None = None, game_id: int|None = None):

        if game_profile_id is not None:

            super().__init__(
                message=f'El perfil de juego con id {game_profile_id} no fue encontrado.',
                status_code=404
            )

        elif user_id is not None and game_id is not None:

            super().__init__(
                message=f'El perfil de juego para el usuario {user_id} y el juego {game_id} no fue encontrado.',
                status_code=404
            )

        else:

            super().__init__(
                message='El perfil de juego no fue encontrado.',
                status_code=404
            )
