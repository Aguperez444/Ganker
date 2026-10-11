from pydantic import BaseModel, Field

from app.infrastructure.api.dto.response.base_classes.videogame_object_response import VideogameObjectResponse


class GetVideogamesResponse(BaseModel):
    videogames: list[VideogameObjectResponse] = Field(..., description="Lista de videojuegos disponibles")
