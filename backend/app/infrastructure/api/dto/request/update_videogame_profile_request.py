from pydantic import BaseModel, Field
from typing import List, Optional

class RoleRankInput(BaseModel):
    role_id: int = Field(..., description="ID del rol seleccionado")
    rank_id: int = Field(..., description="ID del rango asociado al rol")

class UpdateGameProfileRequest(BaseModel):
    character_ids: List[int] = Field(
        default_factory=list,
        description="Lista actualizada de IDs de personajes"
    )
    roles_ranks: List[RoleRankInput] = Field(
        default_factory=list,
        description="Lista actualizada de roles con su rango"
    )
    region_id: Optional[int] = Field(None, description="Id de la region")
    in_game_name: Optional[str] = Field(None, max_length=50, description="Nombre del jugador dentro del juego. "
                                                                         "Se ignora si el perfil tiene una cuenta de Riot vinculada")
