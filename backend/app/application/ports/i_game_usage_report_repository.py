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
    def get_latest_report(self, videogame_id: Optional[int], analysis_type: str) -> Optional['GameUsageReport']:
        """
        Devuelve el último reporte generado para un videojuego y tipo de análisis, para calcular la
        variación y validar que las fechas no se solapen. Con videogame_id=None se consulta
        exclusivamente el alcance general. Devuelve None si no existe un reporte previo.
        """
        raise NotImplementedError

    @abstractmethod
    def get_all_reports(
        self,
        videogame_id: Optional[int] = None,
        analysis_type: Optional[str] = None,
        general_only: bool = False,
    ) -> list['GameUsageReport']:
        """
        Devuelve todos los reportes generados, del más reciente al más antiguo, opcionalmente
        filtrados por videojuego y tipo de análisis. general_only limita el listado al alcance general.
        """
        raise NotImplementedError
