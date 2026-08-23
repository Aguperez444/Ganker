class Players:

    def __init__(self, player_id: int, username: str, mail: str, passwordhash: str):
        self._player_id: int = player_id
        self._username: str = username
        self._mail: str = mail
        self._passwordhash: str = passwordhash

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