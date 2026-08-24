
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.domain.models.game_profile import GameProfile

class Player:


    def __init__(self,
                 player_id: Optional[int],
                 username: str,
                 name: str,
                 mail: Optional[str],
                 password_hash: Optional[str],
                 profiles: list['GameProfile']
                 ):
        self._player_id: Optional[int] = player_id
        self._username: str = username
        self._name: str = name
        self._mail: Optional[str] = mail
        self._password_hash: Optional[str] = password_hash
        self._profiles: list['GameProfile'] = profiles

    @property
    def player_id(self) -> Optional[int]:
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
    def mail(self) -> Optional[str]:
        return self._mail
    @mail.setter
    def mail(self, value: Optional[str]) -> None:
        self._mail = value

    @property
    def password_hash(self) -> Optional[str]:
        return self._password_hash
    @password_hash.setter
    def password_hash(self, value: Optional[str]) -> None:
        self._password_hash = value

    @property
    def profiles(self) -> list['GameProfile']:
        return self._profiles
    @profiles.setter
    def profiles(self, value: list['GameProfile']) -> None:
        self._profiles = value

