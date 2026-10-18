from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.infrastructure.api.dto.response.get.game_usage_report_item_response import GameUsageReportItemResponse


class GenerateGameUsageReportResponse(BaseModel):
    report_id: int = Field(..., description='ID del reporte generado y persistido.')
    generated_by: int = Field(..., description='ID del administrador que generó el reporte.')
    analysis_type: str = Field(..., description='Tipo de análisis generado: ranks, characters o teams.')
    videogame_id: Optional[int] = Field(..., description='ID del videojuego analizado; null representa todos los videojuegos.')
    videogame_name: str = Field(..., description='Nombre del videojuego analizado.')
    icon_url: Optional[str] = Field(None, description='URL del ícono del videojuego analizado, si aplica.')
    start_date: Optional[datetime] = Field(None, description='Fecha inicial del período reportado (null si es histórico acumulado).')
    end_date: Optional[datetime] = Field(None, description='Fecha final del período reportado (null si es histórico acumulado).')
    generated_at: datetime = Field(..., description='Fecha y hora de generación del reporte.')
    total: int = Field(..., description='Base de perfiles vigentes o equipos del alcance; las categorías de rangos/personajes pueden superponerse.')
    has_previous_report: bool = Field(..., description='Indica si se comparó contra un reporte previo del mismo tipo y videojuego.')
    previous_report_id: Optional[int] = Field(None, description='ID del reporte previo utilizado para calcular la variación.')
    items: List[GameUsageReportItemResponse] = Field(..., description='Filas del reporte ordenadas de mayor a menor cantidad.')
