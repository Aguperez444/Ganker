from datetime import date, datetime, time, timezone

from app.domain.exceptions.rank.rank_not_found_exception import RankNotFoundException
from app.domain.exceptions.report.invalid_report_analysis_type_exception import InvalidReportAnalysisTypeException
from app.domain.exceptions.report.invalid_report_date_range_exception import InvalidReportDateRangeException
from app.domain.exceptions.report.no_usage_data_for_report_exception import NoUsageDataForReportException
from app.domain.exceptions.report.rank_bands_required_exception import RankBandsRequiredException
from app.domain.exceptions.report.report_start_date_before_previous_exception import ReportStartDateBeforePreviousException
from app.domain.exceptions.team.invalid_rank_range_exception import InvalidRankRangeException
from app.domain.models.game_usage_report import GameUsageReport
from app.domain.models.game_usage_report_item import GameUsageReportItem
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.infrastructure.api.dto.request.generate_game_usage_report_request import GenerateGameUsageReportRequest
from app.infrastructure.api.dto.response.get.game_usage_report_item_response import GameUsageReportItemResponse
from app.infrastructure.api.dto.response.get.generate_game_usage_report_response import GenerateGameUsageReportResponse


from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from app.domain.models.videogame import Videogame
    from app.application.ports.i_unit_of_work import IUnitOfWork
    from app.infrastructure.api.dto.request.generate_game_usage_report_request import RankBandRequest

ANALYSIS_RANKS = "ranks"
ANALYSIS_CHARACTERS = "characters"
ANALYSIS_TEAMS = "teams"
VALID_ANALYSIS_TYPES = (ANALYSIS_RANKS, ANALYSIS_CHARACTERS, ANALYSIS_TEAMS)

TREND_UP = "sube"
TREND_DOWN = "baja"
TREND_STABLE = "estable"

_ANALYSIS_NOUNS = {
    ANALYSIS_RANKS: "rangos",
    ANALYSIS_CHARACTERS: "personajes",
    ANALYSIS_TEAMS: "equipos",
}


class GenerateGameUsageReport:
    """
    Genera y persiste un reporte de uso de la plataforma para un videojuego específico, según el tipo
    de análisis solicitado: distribución de jugadores por rango, personajes más utilizados o equipos
    por franja de rangos. Si existe un reporte previo del mismo tipo para el mismo videojuego, calcula
    la variación respecto a él.
    """

    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def execute(self, request: GenerateGameUsageReportRequest, admin_id: int) -> GenerateGameUsageReportResponse:
        with self.uow as uow:
            report = self._build_report(uow, request, admin_id)
            saved_report = uow.game_usage_report_repo.create_report(report)
        return self._to_response(saved_report, has_previous_report=report.previous_report_id is not None)

    def _build_report(self, uow: 'IUnitOfWork', request: GenerateGameUsageReportRequest, admin_id: int) -> GameUsageReport:
        analysis_type = (request.analysis_type or ANALYSIS_RANKS).strip().lower()
        if analysis_type not in VALID_ANALYSIS_TYPES:
            raise InvalidReportAnalysisTypeException(request.analysis_type)

        start_datetime = self._to_start_datetime(request.start_date)
        end_datetime = self._to_end_datetime(request.end_date)

        if start_datetime is not None and end_datetime is not None and start_datetime > end_datetime:
            raise InvalidReportDateRangeException()

        # El videojuego es obligatorio: el reporte siempre se acota a un videojuego específico.
        videogame = CatalogValidationService.get_and_validate_exist_videogame(request.videogame_id, uow)

        previous_report = uow.game_usage_report_repo.get_latest_report(videogame.videogame_id, analysis_type)

        # Criterio: la fecha inicial del nuevo reporte no puede ser menor a la fecha final del último reporte previo.
        if (previous_report is not None
                and start_datetime is not None
                and previous_report.end_date is not None
                and start_datetime < previous_report.end_date):
            # noinspection bad-argument-type
            raise ReportStartDateBeforePreviousException(previous_report.end_date)

        if analysis_type == ANALYSIS_RANKS:
            items, total = self._build_rank_items(uow, videogame, start_datetime, end_datetime)
        elif analysis_type == ANALYSIS_CHARACTERS:
            items, total = self._build_character_items(uow, videogame, start_datetime, end_datetime)
        else:
            if not request.rank_bands:
                raise RankBandsRequiredException()
            items, total = self._build_team_items(uow, videogame, start_datetime, end_datetime, request.rank_bands)

        if not items:
            raise NoUsageDataForReportException(self._no_data_detail(videogame, analysis_type))

        self._apply_variation(items, previous_report)

        return GameUsageReport(
            report_id=None,
            generated_by=admin_id,
            analysis_type=analysis_type,
            videogame_id=videogame.videogame_id,
            videogame_name=videogame.name,
            icon_url=videogame.icon_url,
            generated_at=datetime.now(timezone.utc).replace(tzinfo=None),
            total=total,
            items=items,
            start_date=start_datetime,
            end_date=end_datetime,
            previous_report_id=previous_report.report_id if previous_report else None,
        )

    def _build_rank_items(self, uow: 'IUnitOfWork', videogame: 'Videogame', start_date: datetime | None,
                          end_date: datetime | None) -> tuple[list[GameUsageReportItem], int]:
        """
        Llama a build_items pasando los datos de uso de rangos obtenidos del repositorio.
        """
        rows = uow.role_profile_repo.get_rank_usage(videogame.videogame_id, start_date, end_date)

        return self._build_items(rows, lambda rank: rank.rank_id, uow, videogame, start_date, end_date)

    def _build_character_items(self, uow: 'IUnitOfWork', videogame: 'Videogame', start_date: datetime | None,
                               end_date: datetime | None) -> tuple[list[GameUsageReportItem], int]:
        """
        Llama a build_items pasando los datos de uso de personajes obtenidos del repositorio.
        """
        rows = uow.character_priority_repo.get_character_usage(videogame.videogame_id, start_date, end_date)

        return self._build_items(rows, lambda character: character.character_id, uow, videogame, start_date, end_date)

    def _build_items(self, rows, category_id_getter, uow: IUnitOfWork, videogame: 'Videogame',
                     start_date: datetime | None, end_date: datetime | None) -> tuple[list[GameUsageReportItem], int]:
        """
        Construye los items del reporte a partir de las filas obtenidas de la base de datos.
        Después calcula el total de perfiles y devuelve los items ordenados y con porcentaje calculado.
        `category_id_getter` obtiene el id de la entidad representada (rango o personaje) de cada fila.
        """
        items = [
            GameUsageReportItem(
                item_id=None,
                category_id=category_id_getter(entity),
                name=entity.name,
                icon_url=entity.icon_url,
                count=count,
                percentage=0.0,
            )
            for entity, count in rows
        ]

        total = self._get_total_profiles_by_videogame(uow, videogame, start_date, end_date)
        return self._sort_and_calculate_percentage(items, total), total

    def _build_team_items(
        self, uow: 'IUnitOfWork', videogame: 'Videogame', start_date: datetime | None, end_date: datetime | None,
            rank_bands: 'list[RankBandRequest]') -> tuple[list[GameUsageReportItem], int]:
        """
        Construye los items del reporte de equipos por franja de rangos a partir de las filas obtenidas
        de la base de datos. Después calcula el total de equipos y devuelve los items ordenados y con
        porcentaje calculado.
        """
        rows = uow.team_repo.get_team_counts_by_min_rank(videogame.videogame_id, start_date, end_date)
        if not rows:
            return [], 0
        total = sum(count for _, count in rows)

        bands = self._normalize_bands(rank_bands, uow)

        items = []
        for band_name, min_value, max_value in bands:
            count = sum(
                count
                for rank, count in rows
                if min_value <= rank.value <= max_value
            )
            items.append(
                GameUsageReportItem(
                    item_id=None,
                    category_id=None,
                    name=band_name,
                    icon_url=None,
                    count=count,
                    percentage=0.0,
                    rank_range=f"{min_value} - {max_value}",
                )
            )

        return self._sort_and_calculate_percentage(items, total), total

    @staticmethod
    def _normalize_bands(rank_bands: 'list[RankBandRequest]', uow: 'IUnitOfWork') -> list[tuple[str, int, int]]:
        """
        Normaliza las franjas de rangos definidas por el administrador, obteniendo los nombres y valores
        de los rangos desde el repositorio y validando que existan y que los rangos mínimos sean menores
        a los máximos. Devuelve una lista de tuplas con la descripción de la franja y los valores mínimo
        y máximo de los rangos.
        """
        bands: list[tuple[str, int, int]] = []

        for band in rank_bands:
            min_rank = uow.rank_repo.get_rank_by_id(band.min_rank_id)
            max_rank = uow.rank_repo.get_rank_by_id(band.max_rank_id)
            if min_rank is None or max_rank is None:
                raise RankNotFoundException(band.min_rank_id if not min_rank else band.max_rank_id)

            if min_rank.value > max_rank.value:
                raise InvalidRankRangeException(min_rank.value, max_rank.value)

            description = f"Rango {min_rank.name} - {max_rank.name}"

            bands.append((description, min_rank.value, max_rank.value))
        return bands

    @staticmethod
    def _sort_and_calculate_percentage(items: list[GameUsageReportItem], total: int) -> list[GameUsageReportItem]:
        """
        Ordena los items por cantidad descendente y nombre ascendente, y calcula el porcentaje de cada item.
        """
        items.sort(key=lambda item: (-item.count, item.name))
        for item in items:
            item.percentage = round(item.count / total * 100, 2) if total > 0 else 0.0
        return items

    @staticmethod
    def _apply_variation(items: list[GameUsageReportItem], previous_report: GameUsageReport | None) -> None:
        """
        Calcula, para cada item, la variación absoluta y porcentual respecto al reporte previo del mismo
        tipo y videojuego. En las franjas de rangos el emparejamiento se hace por nombre de franja; en
        rangos y personajes por el id de la entidad.
        """
        if previous_report is None:
            return

        previous_counts: dict = {}
        for item in previous_report.items:
            key = item.category_id if item.category_id is not None else item.name
            previous_counts[key] = item.count

        for item in items:
            key = item.category_id if item.category_id is not None else item.name
            previous_count = previous_counts.get(key, 0)
            item.variation = item.count - previous_count
            item.variation_percentage = (
                round(item.variation / previous_count * 100, 2) if previous_count > 0 else None
            )
            item.trend = (
                TREND_UP if item.variation > 0
                else TREND_DOWN if item.variation < 0
                else TREND_STABLE
            )

    @staticmethod
    def _get_total_profiles_by_videogame(uow: 'IUnitOfWork', videogame: 'Videogame', start_date: datetime | None,
                                         end_date: datetime | None) -> int:
        """
        Obtiene el total de perfiles registrados en la plataforma para el videojuego y rango de fechas especificados.
        """
        counts_by_videogame = uow.game_profile_repo.get_profile_counts_by_videogame(start_date, end_date)
        for game, count in counts_by_videogame:
            if game.videogame_id == videogame.videogame_id:
                return count
        return 0

    @staticmethod
    def _no_data_detail(videogame: 'Videogame', analysis_type: str) -> str:
        noun = _ANALYSIS_NOUNS[analysis_type]
        return (
            f'el videojuego "{videogame.name}" no cuenta con perfiles o datos de '
            f"{noun} registrados en el período seleccionado"
        )

    @staticmethod
    def _to_start_datetime(start_date: date | None) -> datetime | None:
        """
        Convierte una fecha a un datetime con hora mínima (00:00:00) para usar como fecha de inicio.
        """
        if start_date:
            return datetime.combine(start_date, time.min)
        return None

    @staticmethod
    def _to_end_datetime(end_date: date | None) -> datetime | None:
        """
        Convierte una fecha a un datetime con hora máxima (23:59:59.999999) para usar como fecha de fin.
        """
        if end_date:
            return datetime.combine(end_date, time.max)
        return None

    @staticmethod
    def _to_response(report: GameUsageReport, has_previous_report: bool) -> GenerateGameUsageReportResponse:
        return GenerateGameUsageReportResponse(
            report_id=report.report_id,
            generated_by=report.generated_by,
            analysis_type=report.analysis_type,
            videogame_id=report.videogame_id,
            videogame_name=report.videogame_name,
            icon_url=report.icon_url,
            start_date=report.start_date,
            end_date=report.end_date,
            generated_at=report.generated_at,
            total=report.total,
            has_previous_report=has_previous_report,
            previous_report_id=report.previous_report_id,
            items=[
                GameUsageReportItemResponse(
                    category_id=item.category_id,
                    name=item.name,
                    icon_url=item.icon_url,
                    count=item.count,
                    percentage=item.percentage,
                    rank_range=item.rank_range,
                    variation=item.variation,
                    variation_percentage=item.variation_percentage,
                    trend=item.trend,
                )
                for item in report.items
            ],
        )
