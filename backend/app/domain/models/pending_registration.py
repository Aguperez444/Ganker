from datetime import datetime

from app.domain.exceptions.entity_not_persisted_exception import EntityNotPersistedException


class PendingRegistration:
    def __init__(self, registration_id: int|None, mail: str, username: str, name: str,
                 password_hash: str, token_hash: str, expires_at: datetime):
        self._registration_id: int|None = registration_id
        self._mail: str = mail
        self._username: str = username
        self._name: str = name
        self._password_hash: str = password_hash
        self._token_hash: str = token_hash
        self._expires_at: datetime = expires_at

    @property
    def registration_id(self) -> int:
        if self._registration_id is None:
            raise EntityNotPersistedException("PendingRegistration")
        return self._registration_id
    @registration_id.setter
    def registration_id(self, value: int):
        self._registration_id = value

    @property
    def mail(self) -> str:
        return self._mail
    @mail.setter
    def mail(self, value: str):
        self._mail = value

    @property
    def username(self) -> str:
        return self._username
    @username.setter
    def username(self, value: str):
        self._username = value

    @property
    def name(self) -> str:
        return self._name
    @name.setter
    def name(self, value: str):
        self._name = value

    @property
    def password_hash(self) -> str:
        return self._password_hash
    @password_hash.setter
    def password_hash(self, value: str):
        self._password_hash = value

    @property
    def token_hash(self) -> str:
        return self._token_hash
    @token_hash.setter
    def token_hash(self, value: str):
        self._token_hash = value

    @property
    def expires_at(self) -> datetime:
        return self._expires_at
    @expires_at.setter
    def expires_at(self, value: datetime):
        self._expires_at = value

    def is_persisted(self) -> bool:
        return self._registration_id is not None
