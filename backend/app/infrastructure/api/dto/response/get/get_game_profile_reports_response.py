from typing import List

from pydantic import BaseModel, Field

from app.infrastructure.api.dto.response.get.game_profile_report_summary_response import \
    GameProfileReportSummaryResponse


class GetGameProfileReportsResponse(BaseModel):
    reports: List[GameProfileReportSummaryResponse] = Field(
        ..., description="Listado de reportes generados, del más reciente al más antiguo"
    )
