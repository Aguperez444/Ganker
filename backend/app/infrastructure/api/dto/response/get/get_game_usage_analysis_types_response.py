from typing import List

from pydantic import BaseModel, Field

from app.infrastructure.api.dto.response.get.game_usage_analysis_type_response import GameUsageAnalysisTypeResponse


class GetGameUsageAnalysisTypesResponse(BaseModel):
    analysis_types: List[GameUsageAnalysisTypeResponse] = Field(
        ..., description="Catálogo de tipos de análisis disponibles para generar reportes de uso."
    )
