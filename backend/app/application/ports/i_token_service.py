from abc import ABC, abstractmethod


class ITokenService(ABC):
    @abstractmethod
    def generate_access_token(self, user_id: int) -> str:
        raise NotImplementedError

    @abstractmethod
    def verify_access_token(self, token: str) -> int:
        raise NotImplementedError
