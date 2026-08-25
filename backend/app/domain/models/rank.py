from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.domain.models.videogame import Videogame


class Rank:
    def __init__(self, rank_id: int,name: str, value: int, videogame: 'Videogame'):
        self._rank_id: int = rank_id
        self._name: str = name
        self._value: int = value
        self._videogame: 'Videogame' = videogame

    @property
    def rank_id(self) -> int:
        return self._rank_id
    @rank_id.setter
    def rank_id(self, value: int) -> None:
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
