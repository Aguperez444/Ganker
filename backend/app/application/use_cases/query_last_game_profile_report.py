from datetime import timedelta

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.response.get.get_last_game_profile_report_response import \
    GetLastGameProfileReportResponse


class QueryLastGameProfileReport:
    """Devuelve información del último reporte generado para asistir al frontend en la selección de fechas."""

    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def execute(self) -> GetLastGameProfileReportResponse:
        with self.uow as uow:
            report = uow.game_profile_report_repo.get_latest_report()

            if report is None:
                return GetLastGameProfileReportResponse(has_report=False)

            # El próximo reporte debe comenzar a partir del fin del anterior;
            # se sugiere el día siguiente para evitar solapamientos.
            suggested_start_date = (
                report.end_date.date() + timedelta(days=1) if report.end_date is not None else None
            )

            return GetLastGameProfileReportResponse(
                has_report=True,
                report_id=report.report_id,
                generated_at=report.generated_at,
                start_date=report.start_date,
                end_date=report.end_date,
                total_profiles=report.total_profiles,
                suggested_start_date=suggested_start_date,
            )
