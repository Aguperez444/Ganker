from datetime import datetime

from pydantic import BaseModel, field_validator


class SearchReportedPlayersResponse(BaseModel):
    id: int
    reported_user_id: int
    reported_user_name: str
    reporter_user_id: int
    reporter_user_name: str
    status: str
    reason: str
    description: str | None
    created_at: datetime
    resolved_at: datetime | None
    resolved_by: str | None

    @field_validator("description", mode="before")
    @classmethod
    def validate_description(cls, value):
        if value is None:
            return "No se especificó una descripción"
        return value