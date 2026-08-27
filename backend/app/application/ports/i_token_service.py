from abc import ABC, abstractmethod
from typing import Tuple


class ITokenService(ABC):
    @abstractmethod
    def generate_tokens(self, user_id: int) -> Tuple[str, str]:
        raise NotImplementedError

    @abstractmethod
    def verify_access_token(self, access_token: str) -> int:
        raise NotImplementedError

    @abstractmethod
    def verify_refresh_token(self, refresh_token: str) -> int:
        pass
