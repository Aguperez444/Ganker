from pydantic import BaseModel

from app.infrastructure.api.dto.response.get_game_profile_response import GetGameProfileResponse


class GetVideogameProfilesResponse(BaseModel):
    videogame_profiles: list[GetGameProfileResponse]