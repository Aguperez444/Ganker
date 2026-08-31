from pydantic import BaseModel, Field
from typing import List

class RoleRankResponse(BaseModel):
    role_id: int
    rank_id: int

class UpdateGameProfileResponse(BaseModel):
    game_profile_id: int = Field(..., description="ID único del perfil actualizado")
    videogame_id: int = Field(..., description="ID del videojuego asociado")
    character_ids: List[int] = Field(..., description="Lista de IDs de los personajes asignados")
    roles_ranks: List[RoleRankResponse] = Field(..., description="Rangos asignados por cada rol")