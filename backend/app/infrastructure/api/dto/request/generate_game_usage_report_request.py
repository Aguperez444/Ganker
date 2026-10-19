from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field


class RankBandRequest(BaseModel):
    min_rank_id: int = Field(..., gt=0, description='id del rango minimo que delimita la franja (inclusive).')
    max_rank_id: int = Field(..., gt=0, description='id del rango máximo que delimita la franja (inclusive).')


class GenerateGameUsageReportRequest(BaseModel):
    videogame_id: Optional[int] = Field(
        None, gt=0,
        description='ID del videojuego. Omitir o enviar null para analizar todos los videojuegos.'
    )

    analysis_type: str = Field(
        "ranks",
        description="Tipo de análisis a generar: 'ranks' (distribución por rangos), 'characters' (personajes más utilizados) o 'teams' (franjas de rangos con más equipos)."
    )

    start_date: Optional[date] = Field(
        None,
        description='Fecha inicial del período a reportar (inclusive). Si se omite, se considera el histórico acumulado.'
    )

    end_date: Optional[date] = Field(
        None,
        description='Fecha final del período a reportar (inclusive). Si se omite, se considera el histórico acumulado.'
    )

    rank_bands: Optional[List[RankBandRequest]] = Field(
        None,
        description='Franjas de rangos definidas por el administrador para el análisis de equipos. Obligatorias para teams por juego. En teams general se omiten y se agrupa por videojuego.'
    )
