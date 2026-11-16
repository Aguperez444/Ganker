from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class ReportPlayerResponse(BaseModel):
    report_id: int = Field(..., description="ID del reporte")
    reporter_id: int = Field(..., description="ID del jugador que realiza el reporte")
    reported_id: int = Field(..., description="ID del jugador reportado")
    status: str = Field(..., description="Estado del reporte")
    reason: str = Field(..., description="Razón del reporte")
    description: str|None = Field(..., description="Descripción del reporte")
    created_at: datetime = Field(..., description="Fecha de creación del reporte")
    evidence_image_url: str | None = Field(None, description="URL de la imagen adjunta como evidencia")
    evidence_video_url: str | None = Field(None, description="Link de YouTube adjunto como evidencia")


    @field_validator("description", mode="before")
    @classmethod
    def set_default_description(cls, value):
        return value if value is not None else "sin razón indicada"