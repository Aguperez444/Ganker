from pydantic import BaseModel, Field
from typing import List

class RoleRankInput(BaseModel):
    role_id: int
    rank_id: int

class UpdateGameProfileRequest(BaseModel):
    character_ids: List[int] = Field(
        default_factory=list,
        description="Lista actualizada de IDs de personajes"
    )
    roles_ranks: List[RoleRankInput] = Field(
        default_factory=list,
        description="Lista actualizada de roles con su rango"
    )