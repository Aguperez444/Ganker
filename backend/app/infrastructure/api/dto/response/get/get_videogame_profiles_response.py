from pydantic import BaseModel, Field

from app.infrastructure.api.dto.response.get.get_game_profile_response import GetGameProfileResponse


class GetVideogameProfilesResponse(BaseModel):
    videogame_profiles: list[GetGameProfileResponse] = Field(..., description="Lista de perfiles de videojuego encontrados")
