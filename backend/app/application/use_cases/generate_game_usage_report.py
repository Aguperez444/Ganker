from datetime import datetime, timezone

from app.domain.exceptions.rank.rank_not_found_exception import RankNotFoundException
from app.domain.exceptions.report.invalid_report_bands_exception import InvalidReportBandsException
from app.domain.exceptions.report.invalid_report_analysis_type_exception import InvalidReportAnalysisTypeException
from app.domain.exceptions.report.no_usage_data_for_report_exception import NoUsageDataForReportException
from app.domain.exceptions.report.rank_bands_required_exception import RankBandsRequiredException
from app.domain.exceptions.team.invalid_rank_range_exception import InvalidRankRangeException
from app.domain.models.game_usage_report import GameUsageReport
from app.domain.models.game_usage_report_item import GameUsageReportItem
from app.domain.models.report_analysis_type import ReportAnalysisType
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.services.report_period_service import ReportPeriodService
from app.domain.services.report_variation_service import ReportVariationService
from app.infrastructure.api.dto.request.generate_game_usage_report_request import GenerateGameUsageReportRequest
from app.infrastructure.api.dto.response.get.game_usage_report_item_response import GameUsageReportItemResponse
from app.infrastructure.api.dto.response.get.generate_game_usage_report_response import GenerateGameUsageReportResponse


from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from app.domain.models.videogame import Videogame
    from app.application.ports.i_unit_of_work import IUnitOfWork
    from app.infrastructure.api.dto.request.generate_game_usage_report_request import RankBandRequest


class GenerateGameUsageReport:
    """
    Genera una instantánea de perfiles o equipos del período para un juego o para todos.
    En el alcance general, los rangos y personajes identifican su juego; los equipos se agrupan
    por videojuego. La comparación se limita al mismo alcance y tipo de análisis.
    """

    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def execute(self, request: GenerateGameUsageReportRequest, admin_id: int) -> GenerateGameUsageReportResponse:
        with self.uow as uow:
            report = self._build_report(uow, request, admin_id)
            saved_report = uow.game_usage_report_repo.create_report(report)
        return self._to_response(saved_report, has_previous_report=report.previous_report_id is not None)

    def _build_report(self, uow: 'IUnitOfWork', request: GenerateGameUsageReportRequest, admin_id: int) -> GameUsageReport:
        analysis_type = ReportAnalysisType.try_from_value(request.analysis_type or ReportAnalysisType.RANKS.value)
        if analysis_type is None:
            raise InvalidReportAnalysisTypeException(request.analysis_type)

        start_datetime, end_datetime = ReportPeriodService.normalize(request.start_date, request.end_date)

        videogame = (
            CatalogValidationService.get_and_validate_exist_videogame(request.videogame_id, uow)
            if request.videogame_id is not None else None
        )
        previous_report = uow.game_usage_report_repo.get_latest_report(request.videogame_id, analysis_type.value)

        # Criterio: la fecha inicial del nuevo reporte no puede ser menor a la fecha final del último reporte previo.
        if previous_report is not None:
            ReportPeriodService.validate_start_not_before_previous(start_datetime, previous_report.end_date)

        if analysis_type is ReportAnalysisType.RANKS:
            items, total = self._build_rank_items(uow, videogame, start_datetime, end_datetime)
        elif analysis_type is ReportAnalysisType.CHARACTERS:
            items, total = self._build_character_items(uow, videogame, start_datetime, end_datetime)
        elif videogame is None:
            if request.rank_bands:
                raise InvalidReportBandsException("Las franjas se definen para un videojuego; el reporte general agrupa equipos por juego.")
            items, total = self._build_general_team_items(uow, start_datetime, end_datetime)
        else:
            if not request.rank_bands:
                raise RankBandsRequiredException()
            items, total = self._build_team_items(uow, videogame, start_datetime, end_datetime, request.rank_bands)

        if not items:
            raise NoUsageDataForReportException(self._no_data_detail(videogame, analysis_type))

        # Las franjas modificadas no representan poblaciones comparables.
        if analysis_type is ReportAnalysisType.TEAMS and videogame is not None and previous_report:
            if {item.rank_range for item in items if item.rank_range is not None} != {item.rank_range for item in previous_report.items if item.rank_range is not None}:
                previous_report = None
        self._apply_variation(items, previous_report)
        self._sort_and_calculate_percentage(items, total)

        return GameUsageReport(
            report_id=None,
            generated_by=admin_id,
            analysis_type=analysis_type.value,
            videogame_id=videogame.videogame_id if videogame else None,
            videogame_name=videogame.name if videogame else "Todos los videojuegos",
            icon_url=videogame.icon_url if videogame else None,
            generated_at=datetime.now(timezone.utc).replace(tzinfo=None),
            total=total,
            items=items,
            start_date=start_datetime,
            end_date=end_datetime,
            previous_report_id=previous_report.report_id if previous_report else None,
        )

    def _build_rank_items(self, uow: 'IUnitOfWork', videogame: 'Videogame | None', start_date: datetime | None,
                          end_date: datetime | None) -> tuple[list[GameUsageReportItem], int]:
        """
        Llama a build_items pasando los datos de uso de rangos obtenidos del repositorio.
        """
        rows = uow.role_profile_repo.get_rank_usage(videogame.videogame_id if videogame else None, start_date, end_date)

        return self._build_items(rows, lambda rank: rank.rank_id, uow, videogame, start_date, end_date)

    def _build_character_items(self, uow: 'IUnitOfWork', videogame: 'Videogame | None', start_date: datetime | None,
                               end_date: datetime | None) -> tuple[list[GameUsageReportItem], int]:
        """
        Llama a build_items pasando los datos de uso de personajes obtenidos del repositorio.
        """
        rows = uow.character_priority_repo.get_character_usage(videogame.videogame_id if videogame else None, start_date, end_date)

        return self._build_items(rows, lambda character: character.character_id, uow, videogame, start_date, end_date)

    def _build_items(self, rows, category_id_getter, uow: IUnitOfWork, videogame: 'Videogame | None',
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
                name=entity.name if videogame else f"{entity.videogame.name} / {entity.name}",
                icon_url=entity.icon_url,
                count=count,
                percentage=0.0,
            )
            for entity, count in rows
        ]

        total = self._get_total_profiles_by_videogame(uow, videogame, start_date, end_date)
        return self._sort_and_calculate_percentage(items, total), total

    def _build_team_items(
        self, uow: 'IUnitOfWork', videogame: 'Videogame | None', start_date: datetime | None, end_date: datetime | None,
            rank_bands: 'list[RankBandRequest]') -> tuple[list[GameUsageReportItem], int]:
        """
        Construye los items del reporte de equipos por franja de rangos a partir de las filas obtenidas
        de la base de datos. Después calcula el total de equipos y devuelve los items ordenados y con
        porcentaje calculado.
        """
        bands = self._normalize_bands(rank_bands, uow, videogame.videogame_id)
        rows = uow.team_repo.get_team_counts_by_min_rank(videogame.videogame_id, start_date, end_date)
        if not rows:
            return [], 0
        total = sum(count for _, count in rows)

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

        uncovered = total - sum(item.count for item in items)
        if uncovered:
            items.append(GameUsageReportItem(None, None, "Fuera de las franjas", None, uncovered, 0.0))
        return self._sort_and_calculate_percentage(items, total), total

    def _build_general_team_items(self, uow, start_date, end_date):
        rows = uow.team_repo.get_team_counts_by_min_rank(None, start_date, end_date)
        games = {}
        for rank, count in rows:
            game = rank.videogame
            previous = games.get(game.videogame_id, (game, 0))[1]
            games[game.videogame_id] = (game, previous + count)
        items = [GameUsageReportItem(None, game.videogame_id, game.name, game.icon_url, count, 0.0)
                 for game, count in games.values()]
        total = sum(item.count for item in items)
        return self._sort_and_calculate_percentage(items, total), total

    @staticmethod
    def _normalize_bands(rank_bands: 'list[RankBandRequest]', uow: 'IUnitOfWork', videogame_id: int) -> list[tuple[str, int, int]]:
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

            if min_rank.videogame.videogame_id != videogame_id or max_rank.videogame.videogame_id != videogame_id:
                raise InvalidReportBandsException("Todos los rangos de las franjas deben pertenecer al videojuego seleccionado.")
            if any(min_rank.value <= upper and max_rank.value >= lower for _, lower, upper in bands):
                raise InvalidReportBandsException("Las franjas de rangos no pueden solaparse.")
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
    def _variation_key(item: GameUsageReportItem):
        return item.category_id if item.category_id is not None else item.rank_range or item.name

    @staticmethod
    def _apply_variation(items: list[GameUsageReportItem], previous_report: GameUsageReport | None) -> None:
        """
        Calcula, para cada item, la variación absoluta y porcentual respecto al reporte previo del mismo
        tipo y alcance. En las franjas el emparejamiento usa sus límites numéricos; en
        rangos y personajes por el id de la entidad.
        """
        if previous_report is None:
            return

        previous_counts = {
            GenerateGameUsageReport._variation_key(item): item.count
            for item in previous_report.items
        }

        current_keys = {GenerateGameUsageReport._variation_key(item) for item in items}
        for old_item in previous_report.items:
            key = GenerateGameUsageReport._variation_key(old_item)
            if key not in current_keys:
                items.append(GameUsageReportItem(None, old_item.category_id, old_item.name, old_item.icon_url,
                                                 0, 0.0, rank_range=old_item.rank_range))
        for item in items:
            key = GenerateGameUsageReport._variation_key(item)
            previous_count = previous_counts.get(key, 0)
            item.variation, item.variation_percentage, item.trend = ReportVariationService.compute(
                item.count, previous_count
            )

    @staticmethod
    def _get_total_profiles_by_videogame(uow: 'IUnitOfWork', videogame: 'Videogame | None', start_date: datetime | None,
                                         end_date: datetime | None) -> int:
        """
        Obtiene el total de perfiles registrados en la plataforma para el videojuego y rango de fechas especificados.
        """
        counts_by_videogame = uow.game_profile_repo.get_profile_counts_by_videogame(start_date, end_date)
        for game, count in counts_by_videogame:
            if videogame is not None and game.videogame_id == videogame.videogame_id:
                return count
        if videogame is None:
            return sum(count for _, count in counts_by_videogame)
        return 0

    @staticmethod
    def _no_data_detail(videogame: 'Videogame | None', analysis_type: ReportAnalysisType) -> str:
        noun = analysis_type.noun
        return (
            f'{videogame.name if videogame else "Los videojuegos"}: no hay perfiles o datos de '
            f"{noun} registrados en el período seleccionado"
        )

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
