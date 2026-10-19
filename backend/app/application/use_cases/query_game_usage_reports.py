from typing import Optional

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.report.invalid_report_analysis_type_exception import InvalidReportAnalysisTypeException
from app.domain.models.report_analysis_type import ReportAnalysisType
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
                analysis_type: Optional[str] = None, general_only: bool = False) -> GetGameUsageReportsResponse:
        normalized_type: Optional[str] = None
        if analysis_type is not None:
            analysis_type_enum = ReportAnalysisType.try_from_value(analysis_type)
            if analysis_type_enum is None:
                raise InvalidReportAnalysisTypeException(analysis_type)
            normalized_type = analysis_type_enum.value

        with self.uow as uow:
            reports = (uow.game_usage_report_repo.get_all_reports(videogame_id, normalized_type, general_only=True)
                       if general_only else uow.game_usage_report_repo.get_all_reports(videogame_id, normalized_type))
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
