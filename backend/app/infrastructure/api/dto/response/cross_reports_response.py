from datetime import datetime

from pydantic import BaseModel

from app.infrastructure.api.dto.response.search_reported_players_response import SearchReportedPlayersResponse


class CrossReportsResponse(BaseModel):
    report_id: int
    window_hours: int
    reference_created_at: datetime
    window_start: datetime
    window_end: datetime
    reports: list[SearchReportedPlayersResponse]
