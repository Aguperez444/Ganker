from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.domain.models.rank import Rank

class IRankRepository(ABC):


    @abstractmethod
    def get_rank_by_id(self, rank_id: int) -> Optional['Rank']:
        raise NotImplementedError

    @abstractmethod
    def get_ranks_by_game_id(self, game_id: int) -> list['Rank']:
        raise NotImplementedError

    @abstractmethod
    def save_rank(self, rank: 'Rank') -> 'Rank':
        raise NotImplementedError

    @abstractmethod
    def update_rank(self, rank: 'Rank') -> 'Rank':
        raise NotImplementedError

    @abstractmethod
    def count_associated_profiles(self, rank_id: int) -> int:
        raise NotImplementedError

    @abstractmethod
    def reassign_associated_profiles(self, source_rank_id: int, target_rank_id: int) -> int:
        raise NotImplementedError

    @abstractmethod
    def delete_rank(self, rank_id: int) -> bool:
        raise NotImplementedError