from pydantic import BaseModel, Field
from typing import List

class RoleRankInput(BaseModel):
    role_id: int
    rank_id: int

class CreateGameProfileRequest(BaseModel):
    videogame_id: int
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