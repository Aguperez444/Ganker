from abc import ABC, abstractmethod
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from app.domain.models.region import Region

class IRegionRepository(ABC):
    @abstractmethod
    def get_by_id(self, region_id: int) -> Optional['Region']:
        pass
