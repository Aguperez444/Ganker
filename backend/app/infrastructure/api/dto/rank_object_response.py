from pydantic import BaseModel

class RankObjectResponse(BaseModel):
    rank_id: int
    name: str
    value: int
    icon_url: str