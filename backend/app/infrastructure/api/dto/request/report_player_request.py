from pydantic import BaseModel, Field

from app.domain.models.report_reason import ReportReason


class ReportPlayerRequest(BaseModel):
    reported_id: int = Field(..., description="ID del reportado")
    reason: ReportReason
    description: str = Field(..., max_length=500, description="Descripción del reporte, máximo 500 caracteres")
