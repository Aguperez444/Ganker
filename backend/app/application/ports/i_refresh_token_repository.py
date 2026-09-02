from abc import ABC, abstractmethod
from datetime import datetime

class IRefreshTokenRepository(ABC):

    @abstractmethod
    def save(self, user_id: int, role: str, jti: str, expires_at: datetime) -> None:
        pass

    @abstractmethod
    def revoke_by_jti(self, jti: str) -> bool:
        pass

    @abstractmethod
    def is_valid(self, jti: str) -> bool:
        pass