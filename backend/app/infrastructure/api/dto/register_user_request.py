from pydantic import BaseModel, EmailStr


class RegisterUserRequest(BaseModel):
    name: str
    username: str
    mail: EmailStr
    password: str
    role: str