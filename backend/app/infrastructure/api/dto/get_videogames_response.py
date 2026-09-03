from pydantic import BaseModel

from app.infrastructure.api.dto.videogame_object_response import VideogameObjectResponse


class GetVideogamesResponse(BaseModel):
    videogames : list[VideogameObjectResponse]