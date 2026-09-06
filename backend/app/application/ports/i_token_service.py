from abc import ABC, abstractmethod
from datetime import datetime
from typing import Tuple, Dict, Any

from app.domain.models.UserRole import UserRole


class ITokenService(ABC):
    @abstractmethod
    def generate_tokens(self, user_id: int, role: UserRole) -> Tuple[str, str, str, datetime]:
        raise NotImplementedError

    @abstractmethod
    def verify_access_token(self, access_token: str) -> Dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def verify_refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        raise NotImplementedError
