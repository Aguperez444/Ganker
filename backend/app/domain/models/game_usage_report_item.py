from typing import Optional

from app.domain.exceptions.entity_not_persisted_exception import EntityNotPersistedException
from app.domain.exceptions.invalid_id_exception import InvalidIdException


class GameUsageReportItem:
    """
    Representa una fila del reporte de uso: un rango, un personaje o una franja de rangos (o un
    videojuego en el resumen comparativo general) junto con su cantidad y porcentaje.
    """

    def __init__(
        self,
        item_id: Optional[int],
        category_id: Optional[int],
        name: str,
        icon_url: Optional[str],
        count: int,
        percentage: float,
        rank_range: Optional[str] = None,
        variation: Optional[int] = None,
        variation_percentage: Optional[float] = None,
        trend: Optional[str] = None,
    ):
        self._item_id: Optional[int] = item_id
        self._category_id = category_id
        self._name = name
        self._icon_url = icon_url
        self._count = count
        self._percentage = percentage
        self._rank_range = rank_range
        self._variation: Optional[int] = variation
        self._variation_percentage: Optional[float] = variation_percentage
        self._trend: Optional[str] = trend

    @property
    def item_id(self) -> int:
        if self._item_id is None:
            raise EntityNotPersistedException("GameUsageReportItem")
        return self._item_id

    @item_id.setter
    def item_id(self, value: int) -> None:
        if isinstance(value, bool) or not isinstance(value, int):
            raise InvalidIdException(value)
        self._item_id = value

    @property
    def category_id(self) -> Optional[int]:
        """ID de la entidad representada (rango, personaje o videojuego). Puede ser None para franjas."""
        return self._category_id

    @property
    def name(self) -> str:
        return self._name

    @property
    def icon_url(self) -> Optional[str]:
        return self._icon_url

    @property
    def count(self) -> int:
        return self._count

    @property
    def percentage(self) -> float:
        return self._percentage

    @percentage.setter
    def percentage(self, value: float) -> None:
        self._percentage = value

    @property
    def rank_range(self) -> Optional[str]:
        """Descripción de la franja de rangos (solo para el análisis de equipos)."""
        return self._rank_range

    @property
    def variation(self) -> Optional[int]:
        """Diferencia absoluta respecto al reporte previo del mismo tipo y videojuego."""
        return self._variation

    @variation.setter
    def variation(self, value: Optional[int]) -> None:
        self._variation = value

    @property
    def variation_percentage(self) -> Optional[float]:
        """Variación porcentual respecto al reporte previo (None si no había valor previo)."""
        return self._variation_percentage

    @variation_percentage.setter
    def variation_percentage(self, value: Optional[float]) -> None:
        self._variation_percentage = value

    @property
    def trend(self) -> Optional[str]:
        """Tendencia de la variación: 'sube', 'baja' o 'estable'."""
        return self._trend

    @trend.setter
    def trend(self, value: Optional[str]) -> None:
        self._trend = value

    def is_persisted(self) -> bool:
        return self._item_id is not None

    def __repr__(self) -> str:
        return (
            f"GameUsageReportItem(item_id={self._item_id or 'sin_id'}, name='{self.name}', count={self.count}, "
            f"percentage={self.percentage}, rank_range='{self.rank_range}', variation={self.variation})"
        )
