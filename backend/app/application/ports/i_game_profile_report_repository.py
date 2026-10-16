from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.domain.models.game_profile_report import GameProfileReport


class IGameProfileReportRepository(ABC):

    @abstractmethod
    def create_report(self, report: 'GameProfileReport') -> 'GameProfileReport':
        raise NotImplementedError

    @abstractmethod
    def get_report_by_id(self, report_id: int) -> Optional['GameProfileReport']:
        raise NotImplementedError

    @abstractmethod
    def get_latest_report(self) -> Optional['GameProfileReport']:
        """Devuelve el último reporte generado (el más reciente por fecha de generación)."""
        raise NotImplementedError

    @abstractmethod
    def get_all_reports(self) -> list['GameProfileReport']:
        """Devuelve todos los reportes generados, del más reciente al más antiguo."""
        raise NotImplementedError
