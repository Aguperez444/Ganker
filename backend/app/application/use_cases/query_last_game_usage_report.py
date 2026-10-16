from datetime import timedelta

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.application.use_cases.generate_game_usage_report import VALID_ANALYSIS_TYPES
from app.domain.exceptions.report.invalid_report_analysis_type_exception import InvalidReportAnalysisTypeException
from app.infrastructure.api.dto.response.get.get_last_game_usage_report_response import GetLastGameUsageReportResponse


class QueryLastGameUsageReport:
    """
    Devuelve la información del último reporte generado para un videojuego y tipo de análisis, para
    asistir al frontend en la selección de un rango de fechas válido (no solapado con el previo).
    """

    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def execute(self, videogame_id: int, analysis_type: str) -> GetLastGameUsageReportResponse:
        normalized_type = (analysis_type or "").strip().lower()
        if normalized_type not in VALID_ANALYSIS_TYPES:
            raise InvalidReportAnalysisTypeException(analysis_type)

        with self.uow as uow:
            report = uow.game_usage_report_repo.get_latest_report(videogame_id, normalized_type)

            if report is None:
                return GetLastGameUsageReportResponse(has_report=False)

            # El próximo reporte debe comenzar a partir del fin del anterior;
            # se sugiere el día siguiente para evitar solapamientos.
            suggested_start_date = (
                report.end_date.date() + timedelta(days=1) if report.end_date is not None else None
            )

            return GetLastGameUsageReportResponse(
                has_report=True,
                report_id=report.report_id,
                analysis_type=report.analysis_type,
                videogame_id=report.videogame_id,
                videogame_name=report.videogame_name,
                generated_at=report.generated_at,
                start_date=report.start_date,
                end_date=report.end_date,
                total=report.total,
                suggested_start_date=suggested_start_date,
            )
