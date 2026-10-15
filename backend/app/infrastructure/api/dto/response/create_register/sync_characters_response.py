from pydantic import BaseModel, Field

from app.infrastructure.api.dto.response.base_classes.character_object_response import CharacterObjectResponse


class SyncCharactersResponse(BaseModel):
    source: str = Field(..., description="Fuente externa desde la que se importaron los personajes")
    created: list[CharacterObjectResponse] = Field(..., description="Personajes nuevos que se registraron")
    skipped_count: int = Field(..., description="Cantidad de personajes que ya existían y no se modificaron")
    failed: list[str] = Field(..., description="Nombres de los personajes que no se pudieron importar")
