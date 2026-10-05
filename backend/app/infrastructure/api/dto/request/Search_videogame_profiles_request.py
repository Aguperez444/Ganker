from typing import List, Optional

from pydantic import BaseModel, Field


class SearchVideogameProfilesRequest(BaseModel):
    videogame_id: int = Field(description='ID del videojuego del que buscar perfiles')
    characters: Optional[List[int]] = Field(default=None, description='Lista de IDs de los personajes deseados')
    roles: Optional[List[int]] = Field(default=None, description='Lista de IDs de los roles preferidos')
    ranks: Optional[List[int]] = Field(default=None, description='Lista de IDs de los rangos a filtrar')
    name: Optional[str] = Field(default=None, min_length=4, max_length=50, description='Nombre del jugador a buscar')
    page: int | None = Field(default=None, description='Número de página para la paginación')
    page_size: int | None = Field(default=None, description='Cantidad de perfiles por página')
    regions: Optional[List[int]] = Field(default=None, description='Lista de IDs de las regiones de los servidores')