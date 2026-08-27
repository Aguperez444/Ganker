from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from models.rank import Rank

class IRankRepository(ABC):


    @abstractmethod
    def get_rank_by_id(self, rank_id: int) -> Optional['Rank']:
        raise NotImplementedError