from typing import List

from pydantic import BaseModel, Field

from app.infrastructure.api.dto.response.get.game_usage_report_summary_response import \
    GameUsageReportSummaryResponse


class GetGameUsageReportsResponse(BaseModel):
    reports: List[GameUsageReportSummaryResponse] = Field(
        ..., description="Listado de reportes de uso generados, del más reciente al más antiguo."
    )
