from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.domain.models.player import Player


class IPlayerRepository(ABC):
    @abstractmethod
    def create_player(self, user_data: 'Player') -> 'Player':
        raise NotImplementedError

    @abstractmethod
    def get_player_by_id(self, player_id: int) -> Optional['Player']:
        raise NotImplementedError

    @abstractmethod
    def get_player_by_username(self, username: str) -> Optional['Player']:
        raise NotImplementedError

    @abstractmethod
    def get_player_by_mail(self, mail: str) -> Optional['Player']:
        raise NotImplementedError

    @abstractmethod
    def update_player(self, player: 'Player') -> 'Player':
        raise NotImplementedError