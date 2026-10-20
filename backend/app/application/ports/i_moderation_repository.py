from abc import ABC, abstractmethod

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.domain.models.player_report import PlayerReport
    from app.infrastructure.database.models.users_banned import UsersBanned


class IModerationRepository(ABC):

    @abstractmethod
    def report_player(self, report: 'PlayerReport') -> 'PlayerReport':
        raise NotImplementedError

    @abstractmethod
    def ban_user(self, player_id: int, admin_id: int, register: 'UsersBanned') -> None:
        raise NotImplementedError

    @abstractmethod
    def unban_user_if_applicable(self, user_id: int) -> None:
        raise NotImplementedError

    @abstractmethod
    def manual_unban_user(self, user_id: int) -> None:
        raise NotImplementedError