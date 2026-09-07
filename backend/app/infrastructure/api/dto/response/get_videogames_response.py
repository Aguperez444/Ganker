from pydantic import BaseModel

from app.infrastructure.api.dto.response.base_classes.videogame_object_response import VideogameObjectResponse


class GetVideogamesResponse(BaseModel):
    videogames : list[VideogameObjectResponse]