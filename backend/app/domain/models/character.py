from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.domain.models.videogame import Videogame


class Character:
    def __init__(self, name: str, videogame: 'Videogame'):
        self._name = name
        self._videogame = videogame

    @property
    def name(self) -> str:
        return self._name
    @name.setter
    def name(self, value: str) -> None:
        self._name = value
    @property
    def videogame(self) -> 'Videogame':
        return self._videogame
    @videogame.setter
    def videogame(self, value: 'Videogame') -> None:
        self._videogame = value
