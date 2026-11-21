from abc import ABC, abstractmethod

from app.domain.models.ban_appeal import AppealableBan, BanAppeal


class IBanAppealRepository(ABC):
    @abstractmethod
    def get_ban(self, user_id: int, ban_id: int, lock: bool = False) -> AppealableBan | None:
        raise NotImplementedError

    @abstractmethod
    def get_by_ban(self, ban_id: int) -> BanAppeal | None:
        raise NotImplementedError

    @abstractmethod
    def get_by_id(self, appeal_id: int, lock: bool = False) -> BanAppeal | None:
        raise NotImplementedError

    @abstractmethod
    def save(self, appeal: BanAppeal) -> BanAppeal:
        raise NotImplementedError

    @abstractmethod
    def search(self, username: str | None, status: str | None, skip: int, limit: int) -> list[BanAppeal]:
        raise NotImplementedError
