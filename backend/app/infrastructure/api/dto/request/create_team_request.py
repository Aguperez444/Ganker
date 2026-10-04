from pydantic import BaseModel, Field
from typing import List

class CreateTeamRequest(BaseModel):
    name: str = Field(..., min_length=1, description="El nombre del equipo")
    allow_other_regions: bool = Field(..., description="Indica si se permiten jugadores de otras regiones")
    videogame_id: int = Field(..., description="El ID del videojuego para el cual se está creando el equipo")
    region_id: int = Field(description="El ID de la región del equipo")
    min_rank_id: int = Field(..., description="El ID del rango mínimo permitido para los miembros del equipo")
    max_rank_id: int = Field(..., description="El ID del rango máximo permitido para los miembros del equipo")
    creator_game_role_id: int = Field(..., description="El ID del rol de juego del creador del equipo")
    vacant_game_role_ids: List[int] = Field(..., description="Lista de IDs de roles de juego vacantes que se buscan para el equipo")
