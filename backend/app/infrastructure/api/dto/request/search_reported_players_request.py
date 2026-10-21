from datetime import datetime

from pydantic import BaseModel


class SearchReportedPlayersRequest(BaseModel):
    reported_by: str | None = None
    reported_user: str | None = None
    status: str | None = None
    reason: str | None = None
    resolved_by: str | None = None
    min_create_date: datetime | None = None
    max_create_date: datetime | None = None
    min_resolve_date: datetime | None = None
    max_resolve_date: datetime | None = None
    skip: int = 0
    limit: int = 10