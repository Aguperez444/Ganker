from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class GameUsageReportSummaryResponse(BaseModel):
    report_id: int = Field(..., description="ID del reporte")
    analysis_type: str = Field(..., description="Tipo de análisis del reporte: ranks, characters o teams.")
    videogame_id: int = Field(..., description="ID del videojuego analizado.")
    videogame_name: str = Field(..., description="Nombre del videojuego analizado.")
    start_date: Optional[datetime] = Field(None, description="Fecha inicial del período reportado (null si es histórico acumulado).")
    end_date: Optional[datetime] = Field(None, description="Fecha final del período reportado (null si es histórico acumulado).")
    generated_at: datetime = Field(..., description="Fecha y hora en que se generó el reporte.")
