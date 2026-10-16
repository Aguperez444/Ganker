from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class GameProfileReportSummaryResponse(BaseModel):
    report_id: int = Field(..., description="ID del reporte")
    generated_at: datetime = Field(..., description="Fecha y hora en que se generó el reporte")
    start_date: Optional[datetime] = Field(None, description="Fecha inicial del período reportado (None si es histórico total)")
    end_date: Optional[datetime] = Field(None, description="Fecha final del período reportado (None si es histórico total)")
