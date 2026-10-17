from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.response.get.game_profile_report_summary_response import \
    GameProfileReportSummaryResponse
from app.infrastructure.api.dto.response.get.get_game_profile_reports_response import \
    GetGameProfileReportsResponse


class QueryGameProfileReports:
    """Devuelve el listado de reportes generados (solo id y fechas) para que el frontend pueda listarlos y exportarlos."""

    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def execute(self) -> GetGameProfileReportsResponse:
        with self.uow as uow:
            reports = uow.game_profile_report_repo.get_all_reports()
            return GetGameProfileReportsResponse(
                reports=[
                    GameProfileReportSummaryResponse(
                        report_id=report.report_id,
                        generated_at=report.generated_at,
                        start_date=report.start_date,
                        end_date=report.end_date,
                    )
                    for report in reports
                ]
            )
