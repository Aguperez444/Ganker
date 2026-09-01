from pydantic import BaseModel

class VideogameObjectResponse(BaseModel):
    id: int
    name: str