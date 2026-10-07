from pydantic import BaseModel


class DeleteRegionResponse(BaseModel):
    message: str