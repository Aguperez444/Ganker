from typing import Optional

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.application.use_cases.generate_game_usage_report import VALID_ANALYSIS_TYPES
from app.domain.exceptions.report.invalid_report_analysis_type_exception import InvalidReportAnalysisTypeException
from app.infrastructure.api.dto.response.get.game_usage_report_summary_response import GameUsageReportSummaryResponse
from app.infrastructure.api.dto.response.get.get_game_usage_reports_response import GetGameUsageReportsResponse


class QueryGameUsageReports:
    """
    Devuelve el listado de reportes de uso generados (id, período, tipo de análisis y videojuego) para
    que el frontend pueda mostrarlos y ofrecer su exportación.
    """

    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def execute(self, videogame_id: Optional[int] = None,
                analysis_type: Optional[str] = None) -> GetGameUsageReportsResponse:
        normalized_type: Optional[str] = None
        if analysis_type is not None:
            normalized_type = analysis_type.strip().lower()
            if normalized_type not in VALID_ANALYSIS_TYPES:
                raise InvalidReportAnalysisTypeException(analysis_type)

        with self.uow as uow:
            reports = uow.game_usage_report_repo.get_all_reports(videogame_id, normalized_type)
            return GetGameUsageReportsResponse(
                reports=[
                    GameUsageReportSummaryResponse(
                        report_id=report.report_id,
                        analysis_type=report.analysis_type,
                        videogame_id=report.videogame_id,
                        videogame_name=report.videogame_name,
                        start_date=report.start_date,
                        end_date=report.end_date,
                        generated_at=report.generated_at,
                    )
                    for report in reports
                ]
            )
