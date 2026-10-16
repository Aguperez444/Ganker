from pydantic import BaseModel, Field


class GameUsageAnalysisTypeResponse(BaseModel):
    value: str = Field(..., description="Código del tipo de análisis a enviar en las solicitudes.")
    label: str = Field(..., description="Nombre legible del tipo de análisis para mostrar en el frontend.")
    description: str = Field(..., description="Descripción de lo que reporta este tipo de análisis.")
    requires_rank_bands: bool = Field(..., description="Indica si este tipo de análisis exige especificar franjas de rangos.")
