from typing import Optional

from pydantic import BaseModel


class UpdateUserResponse(BaseModel):
    user_id: int
    username: str
    name: str
    mail: Optional[str]
    icon_url: Optional[str]