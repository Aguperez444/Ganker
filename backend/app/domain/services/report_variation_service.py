from typing import Optional

TREND_UP = "sube"
TREND_DOWN = "baja"
TREND_STABLE = "estable"


class ReportVariationService:
    """Cálculo de la variación de un valor respecto a un reporte previo, común a todos los reportes."""

    @staticmethod
    def compute(current_count: int, previous_count: int) -> tuple[int, Optional[float], str]:
        """
        Devuelve (variación absoluta, variación porcentual, tendencia) de `current_count` frente a
        `previous_count`. La variación porcentual es None cuando no había un valor previo (> 0).
        """
        variation = current_count - previous_count
        variation_percentage = round(variation / previous_count * 100, 2) if previous_count > 0 else None
        return variation, variation_percentage, ReportVariationService.resolve_trend(variation)

    @staticmethod
    def resolve_trend(variation: int) -> str:
        if variation > 0:
            return TREND_UP
        if variation < 0:
            return TREND_DOWN
        return TREND_STABLE
