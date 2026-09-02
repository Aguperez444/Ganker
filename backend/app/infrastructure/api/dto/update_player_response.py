from typing import Optional

from pydantic import BaseModel


class UpdatePlayerResponse(BaseModel):
    player_id: int
    username: str
    name: str
    mail: Optional[str]