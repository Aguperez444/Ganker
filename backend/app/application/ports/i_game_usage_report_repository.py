from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.domain.models.game_usage_report import GameUsageReport


class IGameUsageReportRepository(ABC):

    @abstractmethod
    def create_report(self, report: 'GameUsageReport') -> 'GameUsageReport':
        raise NotImplementedError

    @abstractmethod
    def get_report_by_id(self, report_id: int) -> Optional['GameUsageReport']:
        raise NotImplementedError

    @abstractmethod
    def get_latest_report(self, videogame_id: int, analysis_type: str) -> Optional['GameUsageReport']:
        """
        Devuelve el último reporte generado para un videojuego y tipo de análisis, para calcular la
        variación y validar que las fechas no se solapen. None si no existe un reporte previo.
        """
        raise NotImplementedError
