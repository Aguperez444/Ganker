from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.domain.models.videogame import Videogame
    from app.domain.models.role import Role


class Character:
    def __init__(self, character_id: int, name: str, videogame: 'Videogame',role: list['Role']):
        self._character_id: int = character_id
        self._name: str = name
        self._videogame: 'Videogame' = videogame
        self._role: list['Role'] = role

    @property
    def character_id(self) -> int:
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
    def role(self) -> list['Role']:
        return self._role
    @role.setter
    def role(self, value: list['Role']) -> None:
        self._role = value
