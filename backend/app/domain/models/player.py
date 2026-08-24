
from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from app.domain.models.game_profile import GameProfile

class Player:

    def __init__(self,
                 player_id: int,
                 username: str,
                 name: str,
                 mail: str,
                 passwordhash: str,
                 profiles: list['GameProfile']
                 ):
        self._player_id: int = player_id
        self._username: str = username
        self._name: str = name
        self._mail: str = mail
        self._passwordhash: str = passwordhash
        self._profiles: list['GameProfile'] = profiles

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
    def name(self) -> str:
        return self._name
    @name.setter
    def name(self, value: str) -> None:
        self._name = value

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
    def profiles(self) -> list['GameProfile']:
        return self._profiles
    @profiles.setter
    def profiles(self, value: list['GameProfile']) -> None:
        self._profiles = value

