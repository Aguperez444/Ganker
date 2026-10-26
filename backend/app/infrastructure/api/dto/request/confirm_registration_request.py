from pydantic import BaseModel, EmailStr, Field


class ConfirmRegistrationRequest(BaseModel):
    token: str = Field(..., min_length=32, max_length=128)


class ResendRegistrationRequest(BaseModel):
    email: EmailStr
