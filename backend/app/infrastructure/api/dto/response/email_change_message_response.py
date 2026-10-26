from pydantic import BaseModel


class EmailChangeMessageResponse(BaseModel):
    message: str
