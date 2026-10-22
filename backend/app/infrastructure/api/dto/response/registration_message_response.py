from pydantic import BaseModel


class RegistrationMessageResponse(BaseModel):
    message: str
