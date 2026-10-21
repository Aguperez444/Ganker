from app.application.ports.i_unit_of_work import IUnitOfWork
from app.application.services.report_response_service import game_profile_report_response
from app.domain.exceptions.report.report_not_found_exception import ReportNotFoundException
from app.infrastructure.api.dto.response.get.generate_game_profile_report_response import GenerateGameProfileReportResponse


class QueryGameProfileReport:
    """Recupera los datos de un reporte persistido sin volver a calcularlo."""

    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def execute(self, report_id: int) -> GenerateGameProfileReportResponse:
        with self.uow as uow:
            report = uow.game_profile_report_repo.get_report_by_id(report_id)
            if report is None:
                raise ReportNotFoundException(report_id)
            return game_profile_report_response(report)
