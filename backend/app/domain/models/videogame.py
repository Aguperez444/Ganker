from typing import Optional


class Videogame:
    def __init__(self, videogame_id: Optional[int], name: str, icon_url:str):
        self._videogame_id = videogame_id
        self._name = name
        self._icon_url: str = icon_url

    @property
    def videogame_id(self) -> Optional[int]:
        return self._videogame_id
    @videogame_id.setter
    def videogame_id(self, value: Optional[int]):
        self._videogame_id = value

    @property
    def name(self) -> str:
        return self._name
    @name.setter
    def name(self, value: str):
        self._name = value

    @property
    def icon_url(self) -> str:
        return self._icon_url
    @icon_url.setter
    def icon_url(self, value: str):
        self._icon_url = value


    def __eq__(self, other: object) -> bool:
        if isinstance(other, Videogame):
            return self._videogame_id is not None and self._videogame_id == other._videogame_id
        return False