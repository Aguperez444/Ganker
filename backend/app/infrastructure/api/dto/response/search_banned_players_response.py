from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SearchBannedPlayersResponse(BaseModel):
    id: int
    banned_by: str
    banned_user: str
    date_create: datetime
    date_expire: Optional[datetime]
    reason: str