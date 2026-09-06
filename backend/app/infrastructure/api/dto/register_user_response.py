from typing import Optional

from pydantic import BaseModel


class RegisterUserResponse(BaseModel):
    user_id: int
    username: str
    name: str
    mail: Optional[str]
    role: str