from datetime import datetime
from abc import ABC, abstractmethod
from typing import Optional

from app.infrastructure.database.models.password_reset_token_orm import PasswordResetTokenORM


class IPasswordResetTokenRepository(ABC):

    @abstractmethod
    def create(self, user_id: int, token_hash: str, expires_at: datetime) -> PasswordResetTokenORM:
        raise NotImplementedError

    @abstractmethod
    def get_by_token_hash(self, token_hash: str) -> Optional[PasswordResetTokenORM]:
        raise NotImplementedError

    @abstractmethod
    def mark_as_used(self, token_id: int) -> None:
        raise NotImplementedError

    @abstractmethod
    def invalidate_all_user_tokens(self, user_id: int) -> None:
        raise NotImplementedError