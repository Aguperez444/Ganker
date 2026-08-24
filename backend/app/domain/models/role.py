from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from backend.app.domain.models.videogame import Videogame


class Role:
    def __init__(self, role_id: int, name: str, videogame: 'Videogame'):
        self._role_id = role_id
        self._name = name
        self._videogame = videogame

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
