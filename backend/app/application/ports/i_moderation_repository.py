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
    def manual_unban_user(self, user_id: int) -> None:
        raise NotImplementedError
