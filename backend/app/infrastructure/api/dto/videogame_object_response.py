from typing import Optional

from pydantic import BaseModel

class VideogameObjectResponse(BaseModel):
    id: int
    name: str
    icon_url: str