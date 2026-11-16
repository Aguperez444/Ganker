from abc import ABC, abstractmethod
from datetime import datetime, timedelta


from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.domain.models.player_report import PlayerReport
    from app.domain.models.user_ban_record import UserBanRecord


class IModerationRepository(ABC):

    @abstractmethod
    def get_active_bans(
        self, username: str | None, skip: int, limit: int,
    ) -> list[tuple[int, str, str, datetime | None]]:
        """Devuelve usuario, username, motivo y vencimiento del último baneo vigente."""
        raise NotImplementedError

    @abstractmethod
    def report_player(self, report: 'PlayerReport', cooldown: timedelta) -> 'PlayerReport':
        """Guarda el reporte si pasó el plazo para ese denunciante y destinatario.

        La verificación y el guardado deben ser atómicos frente a otros reportes
        del mismo denunciante.
        """
        raise NotImplementedError

    @abstractmethod
    def ban_user(self, ban_record: 'UserBanRecord') -> None:
        raise NotImplementedError

    @abstractmethod
    def unban_user_if_applicable(self, user_id: int) -> None:
        raise NotImplementedError

    @abstractmethod
    def manual_unban_user(self, user_id: int, admin_id: int | None = None, source: str = "manual") -> None:
        raise NotImplementedError

    @abstractmethod
    def get_ban_record(self, ban_id: int) -> tuple['UserBanRecord', bool] | None:
        raise NotImplementedError

    @abstractmethod
    def get_player_ban_history(self, user_id: int, before_ban_id: int | None, skip: int, limit: int) -> list[tuple['UserBanRecord', bool]]:
        raise NotImplementedError

    @abstractmethod
    def get_report_for_resolution(self, report_id: int) -> 'PlayerReport | None':
        raise NotImplementedError

    @abstractmethod
    def dismiss_report(self, report: 'PlayerReport') -> None:
        raise NotImplementedError

    @abstractmethod
    def get_player_report(self, report_id: int) -> 'PlayerReport | None':
        raise NotImplementedError

    @abstractmethod
    def get_cross_reports(self, reporter_id: int, reported_id: int,
                          start: datetime, end: datetime, skip: int, limit: int) -> list['PlayerReport']:
        raise NotImplementedError
