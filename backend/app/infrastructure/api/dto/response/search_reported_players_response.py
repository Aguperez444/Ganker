from datetime import datetime

from pydantic import BaseModel


class SearchReportedPlayersResponse(BaseModel):
    id: int
    reported_name: str
    reporter_name: str
    status: str
    reason: str
    description: str
    created_at: datetime
    resolved_at: datetime | None
    resolved_by: str | None