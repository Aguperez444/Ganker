from pydantic import BaseModel

class VideogameObjectResponse(BaseModel):
    id: int
    name: str
    icon_url: str
    rank_per_role: bool