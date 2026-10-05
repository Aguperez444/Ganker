from abc import ABC, abstractmethod
from typing import Optional, TYPE_CHECKING
from typing import Optional

if TYPE_CHECKING:
    from app.domain.models.region import Region


class IRegionRepository(ABC):

    @abstractmethod
    def get_region_by_id(self, region_id: int) -> Optional['Region']:
        raise NotImplementedError()

    @abstractmethod
    def get_regions_by_game_id(self, game_id: int) -> list['Region']:
        raise NotImplementedError

    @abstractmethod
    def get_region_by_name_and_videogame(self, name: str, videogame_id: int) -> Optional['Region']:
        raise NotImplementedError

    @abstractmethod
    def save_region(self, region: 'Region') -> 'Region':
        raise NotImplementedError

    @abstractmethod
    def get_by_id(self, region_id: int) -> Optional['Region']:
        pass
    @abstractmethod
    def update_region(self, region: 'Region') -> 'Region':
        raise NotImplementedError

    @abstractmethod
    def delete_region(self, region_id: int) -> bool:
        raise NotImplementedError

    @abstractmethod
    def count_associated_to_region(self, region_id) -> int:
        raise NotImplementedError