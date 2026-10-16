from typing import Optional

from app.domain.exceptions.entity_not_persisted_exception import EntityNotPersistedException
from app.domain.exceptions.invalid_id_exception import InvalidIdException


class GameProfileReportItem:
    """Representa una fila del reporte: un videojuego con su cantidad de perfiles de jugador asociados."""

    def __init__(self, item_id: Optional[int], videogame_id: int, videogame_name: str,
        icon_url: Optional[str], profile_count: int, percentage: float, variation: Optional[int] = None,
        variation_percentage: Optional[float] = None, trend: Optional[str] = None):
        self._item_id: Optional[int] = item_id
        self._videogame_id: int = videogame_id
        self._videogame_name: str = videogame_name
        self._icon_url: Optional[str] = icon_url
        self._profile_count: int = profile_count
        self._percentage: float = percentage
        self._variation: Optional[int] = variation
        self._variation_percentage: Optional[float] = variation_percentage
        self._trend: Optional[str] = trend

    @property
    def item_id(self) -> int:
        if self._item_id is None:
            raise EntityNotPersistedException("GameProfileReportItem")
        return self._item_id

    @item_id.setter
    def item_id(self, value: int) -> None:
        if isinstance(value, bool) or not isinstance(value, int):
            raise InvalidIdException(value)
        self._item_id = value

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
    def profile_count(self) -> int:
        return self._profile_count

    @property
    def percentage(self) -> float:
        return self._percentage

    @property
    def variation(self) -> Optional[int]:
        return self._variation

    @property
    def variation_percentage(self) -> Optional[float]:
        return self._variation_percentage

    @property
    def trend(self) -> Optional[str]:
        return self._trend

    def is_persisted(self) -> bool:
        return self._item_id is not None

    def __repr__(self) -> str:
        return (f"GameProfileReportItem(item_id={self._item_id or 'sin_id'},"
                f" videogame_id={self.videogame_id}, videogame_name='{self.videogame_name}',"
                f" profile_count={self.profile_count}, percentage={self.percentage},"
                f" variation={self.variation}, trend='{self.trend}')")
