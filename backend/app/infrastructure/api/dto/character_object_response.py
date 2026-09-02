from pydantic import BaseModel

class CharacterObjectResponse(BaseModel):
    character_id: int
    name: str