from datetime import datetime

from pydantic import BaseModel


class ActiveBannedPlayerResponse(BaseModel):
    user_id: int
    username: str
    reason: str
    expires_at: datetime | None


class ActiveBannedPlayersResponse(BaseModel):
    players: list[ActiveBannedPlayerResponse]
