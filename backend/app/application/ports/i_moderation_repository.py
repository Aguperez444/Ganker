from datetime import datetime
from abc import ABC, abstractmethod

from app.infrastructure.database.models.player_report_orm import PlayerReportORM
from app.infrastructure.database.models.users_banned import UsersBanned


class IModerationRepository(ABC):

    @abstractmethod
    def report_player(self, report: PlayerReportORM) -> PlayerReportORM:
        raise NotImplementedError

    @abstractmethod
    def ban_player(self, player_id: int, admin_id: int, register: UsersBanned) -> None:
        raise NotImplementedError

    @abstractmethod
    def unban_player(self, player_id: int) -> None:
        raise NotImplementedError

    @abstractmethod
    def manual_unban_player(self, player_id: int) -> None:
        raise NotImplementedError