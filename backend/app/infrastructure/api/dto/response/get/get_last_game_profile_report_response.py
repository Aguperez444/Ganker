from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class GetLastGameProfileReportResponse(BaseModel):
    has_report: bool = Field(..., description="Indica si existe al menos un reporte generado previamente")
    report_id: Optional[int] = Field(None, description="ID del último reporte generado")
    generated_at: Optional[datetime] = Field(None, description="Fecha y hora en que se generó el último reporte")
    start_date: Optional[datetime] = Field(None, description="Fecha inicial del período del último reporte")
    end_date: Optional[datetime] = Field(None, description="Fecha final del período del último reporte")
    total_profiles: Optional[int] = Field(None, description="Total general de perfiles del último reporte")
    suggested_start_date: Optional[date] = Field(
        None,
        description="Fecha inicial sugerida para el próximo reporte (día siguiente al fin del último). "
                    "Es None si no hay reporte previo o si el anterior fue histórico total."
    )
