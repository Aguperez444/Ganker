from typing import Optional

from pydantic import BaseModel, Field


class GameUsageReportItemResponse(BaseModel):
    category_id: Optional[int] = Field(
        None,
        description='ID de la entidad representada (rango, personaje o videojuego). Es null en las franjas de rangos.'
    )
    name: str = Field(..., description='Nombre de la fila (rango, personaje, franja o videojuego).')
    icon_url: Optional[str] = Field(None, description='URL del ícono de la entidad, si aplica.')
    count: int = Field(..., description='Cantidad de jugadores (rangos/personajes) o equipos (franjas) contabilizados.')
    percentage: float = Field(..., description='Porcentaje que representa respecto al total considerado.')
    rank_range: Optional[str] = Field(
        None,
        description='Descripción de la franja de rangos (solo en el análisis de equipos).'
    )
    variation: Optional[int] = Field(
        None,
        description='Diferencia absoluta respecto al reporte previo del mismo tipo y videojuego (null si no hay reporte previo).'
    )
    variation_percentage: Optional[float] = Field(
        None,
        description='Variación porcentual respecto al reporte previo (null si no había valor previo).'
    )
    trend: Optional[str] = Field(
        None,
        description="Tendencia de la variación: 'sube', 'baja' o 'estable' (null si no hay reporte previo)."
    )
