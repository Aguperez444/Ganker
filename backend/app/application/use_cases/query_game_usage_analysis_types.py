from app.domain.models.report_analysis_type import ReportAnalysisType
from app.infrastructure.api.dto.response.get.game_usage_analysis_type_response import GameUsageAnalysisTypeResponse
from app.infrastructure.api.dto.response.get.get_game_usage_analysis_types_response import GetGameUsageAnalysisTypesResponse


class QueryGameUsageAnalysisTypes:
    """Devuelve el catálogo de tipos de análisis disponibles para generar reportes de uso."""

    def execute(self) -> GetGameUsageAnalysisTypesResponse:
        return GetGameUsageAnalysisTypesResponse(
            analysis_types=[
                GameUsageAnalysisTypeResponse(
                    value=analysis_type.value,
                    label=analysis_type.label,
                    description=analysis_type.description,
                    requires_rank_bands=analysis_type.requires_rank_bands,
                )
                for analysis_type in ReportAnalysisType
            ]
        )
