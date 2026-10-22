from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.domain.models.user import User


class IUserRepository(ABC):
    @abstractmethod
    def create_user(self, user_data: 'User') -> 'User':
        raise NotImplementedError

    @abstractmethod
    def update_user(self, user: 'User') -> 'User':
        raise NotImplementedError

    @abstractmethod
    def get_user_by_id(self, user_id: int) -> Optional['User']:
        raise NotImplementedError

    @abstractmethod
    def get_user_by_username(self, username: str) -> Optional['User']:
        raise NotImplementedError

    @abstractmethod
    def search_users_by_username(self, username: str, limit: int = 20, offset: int = 0) -> list['User']:
        raise NotImplementedError

    @abstractmethod
    def get_user_by_mail(self, mail: str) -> Optional['User']:
        raise NotImplementedError

    @abstractmethod
    def update_user_password(self, user_id: int, new_hashed_password: str) -> None:
        raise NotImplementedError

    @abstractmethod
    def soft_delete_user(self, user_id: int) -> bool:
        raise NotImplementedError
