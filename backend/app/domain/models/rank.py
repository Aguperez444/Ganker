from typing import TYPE_CHECKING, Optional

from app.domain.exceptions.entity_not_persisted_exception import EntityNotPersistedException
from app.domain.exceptions.invalid_id_exception import InvalidIdException

if TYPE_CHECKING:
    from app.domain.models.videogame import Videogame


class Rank:
    def __init__(self, rank_id: Optional[int], name: str, value: int, videogame: 'Videogame', icon_url: str):
        self._rank_id: Optional[int] = rank_id
        self._name: str = name
        self._value: int = value
        self._videogame: 'Videogame' = videogame
        self._icon_url: str = icon_url

    @property
    def rank_id(self) -> int:
        if self._rank_id is None:
            raise EntityNotPersistedException("Rank")
        return self._rank_id
    @rank_id.setter
    def rank_id(self, value: int) -> None:
        if isinstance(value, bool) or not isinstance(value, int):
            raise InvalidIdException(value)
        self._rank_id = value

    @property
    def name(self) -> str:
        return self._name
    @name.setter
    def name(self, value: str) -> None:
        self._name = value

    @property
    def value(self) -> int:
        return self._value
    @value.setter
    def value(self, value: int) -> None:
        self._value = value

    @property
    def videogame(self) -> 'Videogame':
        return self._videogame
    @videogame.setter
    def videogame(self, value: 'Videogame') -> None:
        self._videogame = value

    @property
    def icon_url(self) -> str:
        return self._icon_url
    @icon_url.setter
    def icon_url(self, value: str) -> None:
        self._icon_url = value

    def is_persisted(self) -> bool:
        return self._rank_id is not None

    def __repr__(self) -> str:
        return (f"Rank(rank_id={self.rank_id or 'sin_id'}, name='{self.name}',"
                f" value={self.value}, videogame={self.videogame}, icon_url='{self.icon_url}')")