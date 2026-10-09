from pydantic import BaseModel, Field
from typing import List, Optional

class RoleRankInput(BaseModel):
    role_id: int = Field(..., description="ID del rol seleccionado")
    rank_id: int = Field(..., description="ID del rango asociado al rol")

class CreateGameProfileRequest(BaseModel):
    videogame_id: int = Field(..., description="ID del videojuego para el cual se crea el perfil")
    character_ids: List[int] = Field(
        ...,
        min_length=1,
        description="Lista de IDs de personajes (debe seleccionar al menos uno)"
    )
    roles: List[RoleRankInput] = Field(
        ...,
        min_length=1,
        description="Lista de roles con su rango (debe indicar al menos un rol)"
    )
    region_id: Optional[int] = Field(None, description='ID de la región del jugador')
