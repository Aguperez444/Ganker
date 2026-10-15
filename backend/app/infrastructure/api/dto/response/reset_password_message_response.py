from pydantic import BaseModel


class ResetPasswordMessageResponse(BaseModel):
    message: str