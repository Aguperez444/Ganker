from pydantic import BaseModel
from pydantic import EmailStr



class LoginRequest(BaseModel):
    mail: EmailStr
    password: str