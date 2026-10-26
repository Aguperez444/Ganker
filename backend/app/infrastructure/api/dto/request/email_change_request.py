from pydantic import BaseModel, EmailStr, Field


class RequestEmailChangeRequest(BaseModel):
    mail: EmailStr
    password: str = Field(..., min_length=1)


class ConfirmEmailChangeRequest(BaseModel):
    token: str = Field(..., min_length=32, max_length=128)
