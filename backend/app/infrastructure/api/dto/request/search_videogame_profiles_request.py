from typing import List, Optional

from pydantic import BaseModel, Field


class SearchVideogameProfilesRequest(BaseModel):
    videogame_id: int = Field(..., description="ID del videojuego por el cual filtrar perfiles")
    characters: Optional[List[int]] = Field(None, description="Lista de IDs de personajes por los cuales filtrar")
    roles: Optional[List[int]] = Field(None, description="Lista de IDs de roles por los cuales filtrar")
    ranks: Optional[List[int]] = Field(None, description="Lista de IDs de rangos por los cuales filtrar")
    regions: Optional[List[int]] = Field(None, description="Lista de IDs de regiones por las cuales filtrar")
    name: Optional[str] = Field(min_length=4, max_length=50, default=None, description="Nombre de usuario a buscar (mínimo 4 caracteres)")
    page: int | None = Field(None, description="Número de página para la paginación")
    page_size: int | None = Field(None, description="Cantidad de resultados por página")
