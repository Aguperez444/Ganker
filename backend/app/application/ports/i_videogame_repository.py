from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.domain.models.videogame import Videogame

class IVideogameRepository(ABC):

    @abstractmethod
    def get_videogame_by_id(self, videogame_id: int) -> Optional['Videogame']:
        raise NotImplementedError
