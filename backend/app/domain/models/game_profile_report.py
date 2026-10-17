from datetime import datetime
from typing import List, Optional

from app.domain.exceptions.entity_not_persisted_exception import EntityNotPersistedException
from app.domain.exceptions.invalid_id_exception import InvalidIdException
from app.domain.models.game_profile_report_item import GameProfileReportItem


class GameProfileReport:
    """Reporte de cantidad de perfiles de jugador por videojuego."""

    def __init__(self, report_id: Optional[int], generated_by: int, generated_at: datetime,
        total_profiles: int, items: List[GameProfileReportItem], start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None, previous_report_id: Optional[int] = None):

        self._report_id: Optional[int] = report_id
        self._generated_by: int = generated_by
        self._generated_at: datetime = generated_at
        self._total_profiles: int = total_profiles
        self._items: List[GameProfileReportItem] = items
        self._start_date: Optional[datetime] = start_date
        self._end_date: Optional[datetime] = end_date
        self._previous_report_id: Optional[int] = previous_report_id

    @property
    def report_id(self) -> int:
        if self._report_id is None:
            raise EntityNotPersistedException("GameProfileReport")
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
    def generated_at(self) -> datetime:
        return self._generated_at

    @property
    def total_profiles(self) -> int:
        return self._total_profiles

    @property
    def items(self) -> List[GameProfileReportItem]:
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
        return (f"GameProfileReport(report_id={self._report_id or 'sin_id'},"
                f" generated_by={self.generated_by}, total_profiles={self.total_profiles},"
                f" start_date={self.start_date}, end_date={self.end_date},"
                f" previous_report_id={self.previous_report_id})")
