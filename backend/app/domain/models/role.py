from typing import TYPE_CHECKING

from app.domain.models.character import Character

if TYPE_CHECKING:
    from app.domain.models.videogame import Videogame


class Role:
    def __init__(self, role_id: int, name: str, videogame: 'Videogame', characters: list['Character']):
        self._role_id: int = role_id
        self._name: str = name
        self._videogame: 'Videogame' = videogame
        self._characters: list['Character'] = characters

    @property
    def role_id(self) -> int:
        return self._role_id
    @role_id.setter
    def role_id(self, value: int):
        self._role_id = value
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
    @property
    def characters(self) -> list['Character']:
        return self._characters
    @characters.setter
    def characters(self, value: list['Character']):
        self._characters = value