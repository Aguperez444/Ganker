from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SearchBannedPlayersRequest(BaseModel):
    banned_by: Optional[str] = None
    banned_user: Optional[str] = None
    max_date_create: Optional[datetime] = None
    min_date_create: Optional[datetime] = None
    max_date_expire: Optional[datetime] = None
    min_date_expire: Optional[datetime] = None
    reason: Optional[str] = None
    skip: int = 0
    limit: int = 10