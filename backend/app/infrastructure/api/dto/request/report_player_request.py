from pydantic import BaseModel, Field

from app.infrastructure.database.models.player_report_orm import ReportReason


class ReportPlayerRequest(BaseModel):
    reported_id: int = Field(..., description="ID del reportado")
    reason: ReportReason
    description: str = Field(..., max_length=500, description="Descripción del reporte, máximo 500 caracteres")
