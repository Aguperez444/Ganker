from pydantic import BaseModel


class DeleteRankResponse(BaseModel):
    message: str
