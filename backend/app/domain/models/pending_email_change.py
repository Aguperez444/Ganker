from datetime import datetime

from app.domain.exceptions.entity_not_persisted_exception import EntityNotPersistedException


class PendingEmailChange:
    def __init__(self, pending_email_change_id: int|None, user_id: int, mail: str,
                 token_hash: str, expires_at: datetime):
        self._pending_email_change_id: int|None = pending_email_change_id
        self._user_id: int = user_id
        self._mail: str = mail
        self._token_hash: str = token_hash
        self._expires_at: datetime = expires_at

    @property
    def pending_email_change_id(self) -> int:
        if self._pending_email_change_id is None:
            raise EntityNotPersistedException("PendingEmailChange")
        return self._pending_email_change_id

    @pending_email_change_id.setter
    def pending_email_change_id(self, value: int):
        self._pending_email_change_id = value

    @property
    def user_id(self) -> int:
        return self._user_id

    @property
    def mail(self) -> str:
        return self._mail

    @property
    def token_hash(self) -> str:
        return self._token_hash

    @property
    def expires_at(self) -> datetime:
        return self._expires_at

    def is_persisted(self) -> bool:
        return self._pending_email_change_id is not None
