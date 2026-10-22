from datetime import datetime

from typing import TYPE_CHECKING

from app.domain.exceptions.entity_not_persisted_exception import EntityNotPersistedException

if TYPE_CHECKING:
    from app.domain.models.user import User


class UserBanRecord:

    def __init__(self, user_ban_record_id: int|None, banned_user: 'User', banned_by_user: User,
                 reason: str, created_at: datetime, expires_at: datetime|None):
        self._user_Ban_record_id: int|None = user_ban_record_id
        self._banned_user: 'User' = banned_user
        self._banned_by_user: 'User' = banned_by_user
        self._reason: str = reason
        self._created_at: datetime = created_at
        self._expires_at: datetime|None = expires_at


    @property
    def user_ban_record_id(self) -> int:
        if self._user_Ban_record_id is None:
            raise EntityNotPersistedException('Registro de baneo de usuario')
        return self._user_Ban_record_id
    @user_ban_record_id.setter
    def user_ban_record_id(self, value: int):
        self._user_Ban_record_id = value


    @property
    def banned_user(self) -> 'User':
        return self._banned_user
    @banned_user.setter
    def banned_user(self, value: 'User'):
        self._banned_user = value

    @property
    def banned_by_user(self) -> 'User':
        return self._banned_by_user
    @banned_by_user.setter
    def banned_by_user(self, value: 'User'):
        self._banned_by_user = value

    @property
    def reason(self) -> str:
        return self._reason
    @reason.setter
    def reason(self, value: str):
        self._reason = value

    @property
    def created_at(self) -> datetime:
        return self._created_at
    @created_at.setter
    def created_at(self, value: datetime):
        self._created_at = value

    @property
    def expires_at(self) -> datetime|None:
        return self._expires_at
    @expires_at.setter
    def expires_at(self, value: datetime):
        self._expires_at = value

    def is_persisted(self) -> bool:
        return self._user_Ban_record_id is not None
