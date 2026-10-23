from abc import ABC, abstractmethod

from app.domain.models.pending_email_change import PendingEmailChange


class IPendingEmailChangeRepository(ABC):
    @abstractmethod
    def save(self, email_change: PendingEmailChange) -> None:
        raise NotImplementedError

    @abstractmethod
    def get_by_token_hash(self, token_hash: str) -> PendingEmailChange | None:
        raise NotImplementedError

    @abstractmethod
    def consume(self, token_hash: str) -> bool:
        raise NotImplementedError

    @abstractmethod
    def delete_by_user_id(self, user_id: int) -> None:
        raise NotImplementedError
