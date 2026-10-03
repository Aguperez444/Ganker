from typing import Optional, TYPE_CHECKING

from app.domain.exceptions.entity_not_persisted_exception import EntityNotPersistedException
from app.domain.exceptions.invalid_id_exception import InvalidIdException

if TYPE_CHECKING:
    from app.domain.models.videogame import Videogame


class Region:
    def __init__(self, region_id: Optional[int], name: str, videogame: 'Videogame'):
        self._region_id = region_id
        self._name = name
        self._videogame = videogame

    @property
    def region_id(self) -> int:
        if self._region_id is None:
            raise EntityNotPersistedException("Region")
        return self._region_id
    @region_id.setter
    def region_id(self, value: int):
        if isinstance(value, bool) or not isinstance(value, int):
            raise InvalidIdException(value)
        self._region_id = value

    @property
    def name(self) -> str:
        return self._name
    @name.setter
    def name(self, value: str):
        self._name = value

    @property
    def videogame(self) -> 'Videogame':
        return self._videogame
    @videogame.setter
    def videogame(self, value: 'Videogame'):
        self._videogame = value

    def __eq__(self, other: object) -> bool:
        if isinstance(other, Region):
            return self._region_id is not None and self._region_id == other._region_id
        return False

    def is_persisted(self) -> bool:
        return self._region_id is not None

    def __repr__(self) -> str:
        return f"Region(region_id={self.region_id if self.is_persisted() else 'sin_id'}, name='{self.name}', videogame={self.videogame})"
