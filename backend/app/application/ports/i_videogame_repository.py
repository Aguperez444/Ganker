from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.domain.models.videogame import Videogame

class IVideogameRepository(ABC):

    @abstractmethod
    def register_videogame(self, videogame: 'Videogame') -> 'Videogame':
        raise NotImplementedError

    @abstractmethod
    def get_videogame_by_id(self, videogame_id: int) -> Optional['Videogame']:
        raise NotImplementedError

    @abstractmethod
    def get_videogame_by_name(self, videogame_name: str) -> Optional['Videogame']:
        raise NotImplementedError
    # Este metodo es utilizado recibiendo un str name.lower(), comparar nombres usando lower() para evitar problemas de mayusculas y minusculas

    @abstractmethod
    def update_videogame(self, videogame: 'Videogame') -> 'Videogame':
        raise NotImplementedError