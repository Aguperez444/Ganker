from datetime import datetime, timezone

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.application.services.report_response_service import game_profile_report_response
from app.domain.exceptions.report.no_data_for_report_exception import NoDataForReportException
from app.domain.models.game_profile_report import GameProfileReport
from app.domain.models.game_profile_report_item import GameProfileReportItem
from app.domain.services.report_period_service import ReportPeriodService
from app.domain.services.report_variation_service import ReportVariationService
from app.infrastructure.api.dto.request.generate_game_profile_report_request import GenerateGameProfileReportRequest
from app.infrastructure.api.dto.response.get.generate_game_profile_report_response import GenerateGameProfileReportResponse


class GenerateGameProfileReport:
    """
    Genera el reporte de cantidad de perfiles de jugador por videojuego.

    - Lista todos los videojuegos registrados, ordenados de mayor a menor cantidad de perfiles.
    - Incluye el porcentaje de cada videojuego respecto al total.
    - Si existe un reporte previo, calcula la variación respecto a él.
    - Valida que la fecha inicial no sea menor a la fecha final del último reporte previo.
    - Notifica cuando no hay perfiles de jugador registrados.
    """

    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def execute(self, request: GenerateGameProfileReportRequest, admin_id: int) -> GenerateGameProfileReportResponse:
        start_datetime, end_datetime = ReportPeriodService.normalize(request.start_date, request.end_date)

        with self.uow as uow:
            previous_report = uow.game_profile_report_repo.get_latest_report()

            # Criterio: la fecha inicial del nuevo reporte no puede ser menor a la fecha final del último reporte previo
            if previous_report is not None:
                ReportPeriodService.validate_start_not_before_previous(start_datetime, previous_report.end_date)

            counts_by_videogame = uow.game_profile_repo.get_profile_counts_by_videogame(
                start_datetime, end_datetime
            )
            total_profiles = sum(count for _, count in counts_by_videogame)

            if total_profiles == 0:
                raise NoDataForReportException()

            previous_counts = self._build_previous_counts(previous_report)

            items = [
                self._build_item(videogame, count, total_profiles, previous_report, previous_counts)
                for videogame, count in counts_by_videogame
            ]
            # Orden descendente por popularidad (mayor cantidad de perfiles primero)
            items.sort(key=lambda item: (-item.profile_count, item.videogame_name))

            report = GameProfileReport(
                report_id=None,
                generated_by=admin_id,
                generated_at=datetime.now(timezone.utc).replace(tzinfo=None),
                total_profiles=total_profiles,
                items=items,
                start_date=start_datetime,
                end_date=end_datetime,
                previous_report_id=previous_report.report_id if previous_report else None,
            )

            saved_report = uow.game_profile_report_repo.create_report(report)
            return game_profile_report_response(saved_report)

    def _build_previous_counts(self, previous_report: GameProfileReport | None) -> dict[int, int]:
        if previous_report is None:
            return {}
        return {item.videogame_id: item.profile_count for item in previous_report.items}

    def _build_item(
        self,
        videogame,
        profile_count: int,
        total_profiles: int,
        previous_report: GameProfileReport | None,
        previous_counts: dict[int, int]
    ) -> GameProfileReportItem:
        percentage = round((profile_count / total_profiles) * 100, 2)

        variation = None
        variation_percentage = None
        trend = None
        if previous_report is not None:
            previous_count = previous_counts.get(videogame.videogame_id, 0)
            variation, variation_percentage, trend = ReportVariationService.compute(profile_count, previous_count)

        return GameProfileReportItem(
            item_id=None,
            videogame_id=videogame.videogame_id,
            videogame_name=videogame.name,
            icon_url=videogame.icon_url,
            profile_count=profile_count,
            percentage=percentage,
            variation=variation,
            variation_percentage=variation_percentage,
            trend=trend,
        )
