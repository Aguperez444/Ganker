from datetime import datetime

from pydantic import BaseModel, Field


class ReportPlayerResponse(BaseModel):
    id: int = Field(..., description="ID del reporte")
    reporter_id: int = Field(..., description="ID del jugador que realiza el reporte")
    reported_id: int = Field(..., description="ID del jugador reportado")
    status: str = Field(..., description="Estado del reporte")
    reason: str = Field(..., description="Razón del reporte")
    description: str = Field(..., description="Descripción del reporte")
    create_at: datetime = Field(..., description="Fecha de creación del reporte")