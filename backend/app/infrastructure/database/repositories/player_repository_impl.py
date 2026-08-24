from app.application.ports.i_player_repository import IPlayerRepository

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.domain.models.player import Player


class PlayerRepositoryImpl(IPlayerRepository):
    def __init__(self):
        print()
        print()
        print('-' * 100)
        print("CREAR EL PLAYER REPOSITORY IMPL")
        print('-' * 100)
        print()
        print()

    def create_player(self, user_data: 'Player') -> 'Player':
        raise NotImplementedError("Method not implemented yet.")

    def get_player_by_mail(self, mail):
        raise NotImplementedError("Method not implemented yet.")

    def get_player_by_id(self, player_id: int) -> 'Player':
        raise NotImplementedError("Method not implemented yet.")


