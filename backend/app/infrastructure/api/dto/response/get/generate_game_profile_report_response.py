from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.infrastructure.api.dto.response.get.game_profile_report_item_response import GameProfileReportItemResponse


class GenerateGameProfileReportResponse(BaseModel):
    report_id: int = Field(..., description="ID del reporte generado")
    generated_by: int = Field(..., description="ID del administrador que generó el reporte")
    generated_at: datetime = Field(..., description="Fecha y hora de generación del reporte")
    start_date: Optional[datetime] = Field(None, description="Fecha inicial del período reportado")
    end_date: Optional[datetime] = Field(None, description="Fecha final del período reportado")
    total_profiles: int = Field(..., description="Total general de perfiles de jugador considerados en el reporte")
    has_previous_report: bool = Field(..., description="Indica si se comparó contra un reporte previo")
    previous_report_id: Optional[int] = Field(None, description="ID del reporte previo utilizado para calcular la variación")
    items: List[GameProfileReportItemResponse] = Field(..., description="Videojuegos ordenados de mayor a menor cantidad de perfiles")
