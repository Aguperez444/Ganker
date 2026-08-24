from pydantic import BaseModel
from pydantic import EmailStr


class RegisterPlayerRequest(BaseModel):
    name: str
    username: str
    mail: EmailStr
    password: str