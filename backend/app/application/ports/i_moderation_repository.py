from abc import ABC, abstractmethod


from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.domain.models.player_report import PlayerReport
    from app.domain.models.user_ban_record import UserBanRecord


class IModerationRepository(ABC):

    @abstractmethod
    def report_player(self, report: 'PlayerReport') -> 'PlayerReport':
        raise NotImplementedError

    @abstractmethod
    def ban_user(self, ban_record: 'UserBanRecord') -> None:
        raise NotImplementedError

    @abstractmethod
    def unban_user_if_applicable(self, user_id: int) -> None:
        raise NotImplementedError

    @abstractmethod
    def manual_unban_user(self, user_id: int) -> None:
        raise NotImplementedError