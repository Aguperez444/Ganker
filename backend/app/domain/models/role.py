from typing import TYPE_CHECKING, Optional

from app.domain.exceptions.entity_not_persisted_exception import EntityNotPersistedException
from app.domain.exceptions.invalid_id_exception import InvalidIdException

if TYPE_CHECKING:
    from app.domain.models.videogame import Videogame


class Role:
    def __init__(self, role_id: Optional[int], name: str, videogame: 'Videogame', icon_url: str):
        self._role_id: Optional[int] = role_id
        self._name: str = name
        self._videogame: 'Videogame' = videogame
        self._icon_url: str = icon_url

    @property
    def role_id(self) -> int:
        if self._role_id is None:
            raise EntityNotPersistedException("Role")
        return self._role_id
    @role_id.setter
    def role_id(self, value: int):
        if isinstance(value, bool) or not isinstance(value, int):
            raise InvalidIdException(value)
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
    def icon_url(self) -> str:
        return self._icon_url
    @icon_url.setter
    def icon_url(self, value: str):
        self._icon_url = value

    def is_persisted(self) -> bool:
        return self._role_id is not None

    def __repr__(self) -> str:
        return (f"Role(role_id={self.role_id or 'sin_id'}, name='{self.name}',"
                f" videogame={self.videogame}, icon_url='{self.icon_url}')")