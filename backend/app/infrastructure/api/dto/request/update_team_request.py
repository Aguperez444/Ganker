from pydantic import BaseModel, Field, field_validator
from typing import Optional


class UpdateTeamRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="El nombre del equipo")
    description: Optional[str] = Field(None, max_length=500, description="Mensaje descriptivo del equipo")
    allow_other_regions: bool = Field(..., description="Indica si se permiten jugadores de otras regiones")
    region_id: Optional[int] = Field(None, description="El ID de la región del equipo")
    min_rank_id: int = Field(..., description="El ID del rango mínimo permitido para los miembros del equipo")
    max_rank_id: int = Field(..., description="El ID del rango máximo permitido para los miembros del equipo")

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("El nombre del equipo no puede estar vacío")
        return value
