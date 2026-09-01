from pydantic import BaseModel

from app.infrastructure.api.dto.character_object_response import CharacterObjectResponse

class GetCharactersResponse(BaseModel):
    characters : list[CharacterObjectResponse]