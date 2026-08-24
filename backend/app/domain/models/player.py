
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.domain.models.character import Character
    from app.domain.models.rank import Rank
    from app.domain.models.videogame import Videogame

class Player:

    def __init__(self, player_id: int, username: str, mail: str, passwordhash: str,
                 played_videogames: list['Videogame'], main_characters: list['Character'],
                 ranks: list['Rank']):
        self._player_id: int = player_id
        self._username: str = username
        self._mail: str = mail
        self._passwordhash: str = passwordhash
        self._played_videogames: list['Videogame'] = played_videogames
        self._main_characters: list['Character'] = main_characters
        self._ranks: list['Rank'] = ranks

    @property
    def player_id(self) -> int:
        return self._player_id
    @player_id.setter
    def player_id(self, value: int) -> None:
        self._player_id = value

    @property
    def username(self) -> str:
        return self._username
    @username.setter
    def username(self, value: str) -> None:
        self._username = value

    @property
    def mail(self) -> str:
        return self._mail
    @mail.setter
    def mail(self, value: str) -> None:
        self._mail = value

    @property
    def passwordhash(self) -> str:
        return self._passwordhash
    @passwordhash.setter
    def passwordhash(self, value: str) -> None:
        self._passwordhash = value

    @property
    def played_videogames(self) -> list['Videogame']:
        return self._played_videogames
    @played_videogames.setter
    def played_videogames(self, value: list['Videogame']) -> None:
        self._played_videogames = value

    @property
    def main_characters(self) -> list['Character']:
        return self._main_characters
    @main_characters.setter
    def main_characters(self, value: list['Character']) -> None:
        self._main_characters = value

    @property
    def ranks(self) -> list['Rank']:
        return self._ranks
    @ranks.setter
    def ranks(self, value: list['Rank']) -> None:
        self._ranks = value

