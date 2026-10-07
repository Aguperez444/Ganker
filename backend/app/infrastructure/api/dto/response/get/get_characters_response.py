from pydantic import BaseModel

from app.infrastructure.api.dto.response.base_classes.character_object_response import CharacterObjectResponse

class GetCharactersResponse(BaseModel):
    characters : list[CharacterObjectResponse]