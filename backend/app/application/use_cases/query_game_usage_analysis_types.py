from app.application.use_cases.generate_game_usage_report import ANALYSIS_TYPE_CATALOG
from app.infrastructure.api.dto.response.get.game_usage_analysis_type_response import GameUsageAnalysisTypeResponse
from app.infrastructure.api.dto.response.get.get_game_usage_analysis_types_response import GetGameUsageAnalysisTypesResponse


class QueryGameUsageAnalysisTypes:
    """Devuelve el catálogo de tipos de análisis disponibles para generar reportes de uso."""

    def execute(self) -> GetGameUsageAnalysisTypesResponse:
        return GetGameUsageAnalysisTypesResponse(
            analysis_types=[
                GameUsageAnalysisTypeResponse(**entry)
                for entry in ANALYSIS_TYPE_CATALOG
            ]
        )
