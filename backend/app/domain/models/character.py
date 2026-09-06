from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.domain.models.videogame import Videogame



class Character:
    def __init__(self, character_id: int, name: str, videogame: 'Videogame', icon_url: str):
        self._character_id: Optional[int] = character_id
        self._name: str = name
        self._videogame: 'Videogame' = videogame
        self.icon_url: str = icon_url

    @property
    def character_id(self) -> Optional[int]:
        return self._character_id
    @character_id.setter
    def character_id(self, value: int) -> None:
        self._character_id = value

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

    @property
    def icon_url(self) -> str:
        return self._icon_url
    @icon_url.setter
    def icon_url(self, value: str) -> None:
        self._icon_url = value