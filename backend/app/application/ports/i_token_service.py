from abc import ABC, abstractmethod
from datetime import datetime
from typing import Tuple, Dict, Any


class ITokenService(ABC):
    @abstractmethod
    def generate_tokens(self, user_id: int, role: str) -> Tuple[str, str, str, datetime]:
        raise NotImplementedError

    @abstractmethod
    def verify_access_token(self, access_token: str) -> Dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def verify_refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        pass
