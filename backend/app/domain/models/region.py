from typing import Optional, TYPE_CHECKING

from app.domain.exceptions.entity_not_persited_exception import EntityNotPersistedException
from app.domain.exceptions.invalid_id_exception import InvalidIdException

if TYPE_CHECKING:
    from app.domain.models.videogame import Videogame


class Region:

    def __init__(self, region_id: Optional[int], name: str, videogame: 'Videogame'):
        self._region_id: Optional[int] = region_id
        self._name: str = name
        self._videogame: 'Videogame' = videogame

    @property
    def region_id (self) -> int:
        if self._region_id is None:
            raise EntityNotPersistedException("Region")
        return self._region_id
    @region_id.setter
    def region_id(self, value: int)-> None:
        if isinstance(value, bool) or not isinstance(value, int):
            raise InvalidIdException(value)
        self._region_id = value

    @property
    def name (self) -> str:
        return self._name
    @name.setter
    def name (self, name: str) -> None:
            self._name = name

    @property
    def videogame(self) -> Videogame:
        return self._videogame
    @videogame.setter
    def videogame (self, videogame: Videogame) -> None:
        self._videogame = videogame

    def is_persisted(self) -> bool:
        return self._region_id is not None

    def __repr__(self) -> str:
        return (f"Region(region_id={self.region_id or 'sin_id'} , name={self.name},"
                f"videogame={self.videogame})")