from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.domain.models.videogame import Videogame


class Role:
    def __init__(self, role_id: Optional[int], name: str, videogame: 'Videogame', icon_url: str):
        self._role_id: Optional[int] = role_id
        self._name: str = name
        self._videogame: 'Videogame' = videogame
        self._icon_url: str = icon_url

    @property
    def role_id(self) -> Optional[int]:
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
    def icon_url(self) -> str:
        return self._icon_url
    @icon_url.setter
    def icon_url(self, value: str):
        self._icon_url = value

    def __repr__(self) -> str:
        return (f"Role(role_id={self.role_id or 'sin_id'}, name='{self.name}',"
                f" videogame={self.videogame}, icon_url='{self.icon_url}')")