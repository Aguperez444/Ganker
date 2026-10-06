from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

class CreateTeamRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="El nombre del equipo")
    description: Optional[str] = Field(None, max_length=500, description="Mensaje descriptivo del equipo")
    allow_other_regions: bool = Field(..., description="Indica si se permiten jugadores de otras regiones")
    videogame_id: int = Field(..., description="El ID del videojuego para el cual se está creando el equipo")
    region_id: Optional[int] = Field(None, description="El ID de la región del equipo")
    min_rank_id: int = Field(..., description="El ID del rango mínimo permitido para los miembros del equipo")
    max_rank_id: int = Field(..., description="El ID del rango máximo permitido para los miembros del equipo")
    creator_game_role_id: int = Field(..., description="El ID del rol de juego del creador del equipo")
    vacant_game_role_ids: List[int] = Field(..., min_length=1, description="Lista de IDs de roles de juego vacantes que se buscan para el equipo (al menos una)")

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("El nombre del equipo no puede estar vacío")
        return value
