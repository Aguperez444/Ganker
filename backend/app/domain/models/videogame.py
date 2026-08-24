class Videogame:
    def __init__(self, videogame_id: int, name: str):
        self._videogame_id = videogame_id
        self._name = name

    @property
    def videogame_id(self) -> int:
        return self._videogame_id
    @videogame_id.setter
    def videogame_id(self, value: int):
        self._videogame_id = value

    @property
    def name(self) -> str:
        return self._name
    @name.setter
    def name(self, value: str):
        self._name = value