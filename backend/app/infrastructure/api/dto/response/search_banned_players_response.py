from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SearchBannedPlayersResponse(BaseModel):
    id: int
    banned_by_user_id: int
    banned_by_user_username: str
    banned_user_id: int
    banned_user_username: str
    date_created: datetime
    date_expire: Optional[datetime]
    reason: str