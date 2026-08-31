from pydantic import BaseModel, Field
from typing import List

class RoleRankAssignment(BaseModel):
    role_id: int
    rank_id: int

class UpdateGameProfileRequest(BaseModel):
    role_ids: list[int] = []
    character_ids: List[int] = Field(
        ...,
        min_length=1,
        description="Lista de IDs de personajes"
    )
    roles_ranks: List[RoleRankAssignment] = Field(
        ...,
        min_length=1,
        description="Lista de roles con su rango"
    )