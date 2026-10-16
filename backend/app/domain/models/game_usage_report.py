from datetime import datetime
from typing import List, Optional

from app.domain.exceptions.entity_not_persisted_exception import EntityNotPersistedException
from app.domain.exceptions.invalid_id_exception import InvalidIdException
from app.domain.models.game_usage_report_item import GameUsageReportItem


class GameUsageReport:
    """
    Reporte de uso de la plataforma para un videojuego específico: distribución por rangos,
    personajes más utilizados o equipos por franja de rangos. Guarda además el reporte previo del
    mismo tipo y videojuego con el que se calculó la variación, si existía.
    """

    def __init__(
        self,
        report_id: Optional[int],
        generated_by: int,
        analysis_type: str,
        videogame_id: int,
        videogame_name: str,
        icon_url: Optional[str],
        generated_at: datetime,
        total: int,
        items: List[GameUsageReportItem],
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        previous_report_id: Optional[int] = None,
    ):
        self._report_id: Optional[int] = report_id
        self._generated_by = generated_by
        self._analysis_type = analysis_type
        self._videogame_id = videogame_id
        self._videogame_name = videogame_name
        self._icon_url = icon_url
        self._generated_at = generated_at
        self._total = total
        self._items = items
        self._start_date = start_date
        self._end_date = end_date
        self._previous_report_id = previous_report_id

    @property
    def report_id(self) -> int:
        if self._report_id is None:
            raise EntityNotPersistedException("GameUsageReport")
        return self._report_id

    @report_id.setter
    def report_id(self, value: int) -> None:
        if isinstance(value, bool) or not isinstance(value, int):
            raise InvalidIdException(value)
        self._report_id = value

    @property
    def generated_by(self) -> int:
        return self._generated_by

    @property
    def analysis_type(self) -> str:
        return self._analysis_type

    @property
    def videogame_id(self) -> int:
        return self._videogame_id

    @property
    def videogame_name(self) -> str:
        return self._videogame_name

    @property
    def icon_url(self) -> Optional[str]:
        return self._icon_url

    @property
    def generated_at(self) -> datetime:
        return self._generated_at

    @property
    def total(self) -> int:
        return self._total

    @property
    def items(self) -> List[GameUsageReportItem]:
        return self._items

    @property
    def start_date(self) -> Optional[datetime]:
        return self._start_date

    @property
    def end_date(self) -> Optional[datetime]:
        return self._end_date

    @property
    def previous_report_id(self) -> Optional[int]:
        return self._previous_report_id

    def is_persisted(self) -> bool:
        return self._report_id is not None

    def __repr__(self) -> str:
        return (
            f"GameUsageReport(report_id={self._report_id or 'sin_id'}, analysis_type='{self.analysis_type}', "
            f"videogame='{self.videogame_name}', total={self.total}, start_date={self.start_date}, "
            f"end_date={self.end_date}, previous_report_id={self.previous_report_id})"
        )
