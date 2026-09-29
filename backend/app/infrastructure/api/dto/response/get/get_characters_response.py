from pydantic import BaseModel, Field

from app.infrastructure.api.dto.response.base_classes.character_object_response import CharacterObjectResponse

class GetCharactersResponse(BaseModel):
    characters: list[CharacterObjectResponse] = Field(..., description="Lista de personajes del videojuego")
