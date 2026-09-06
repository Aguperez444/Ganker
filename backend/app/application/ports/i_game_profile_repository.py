from abc import abstractmethod, ABC
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.domain.models.game_profile import GameProfile

class IGameProfileRepository(ABC):

    @abstractmethod
    def create_game_profile(self, game_profile: 'GameProfile') -> 'GameProfile':
        raise NotImplementedError

    @abstractmethod
    def get_game_profile_by_id(self, game_profile_id: int) -> Optional['GameProfile']:
        raise NotImplementedError

    @abstractmethod
    def get_game_profile_by_player_and_videogame(self, player_id: int, videogame_id: int) -> Optional['GameProfile']:
        raise NotImplementedError

    @abstractmethod
    def update_game_profile(self, game_profile: 'GameProfile') -> 'GameProfile':
        raise NotImplementedError