from pydantic import BaseModel

from app.infrastructure.api.dto.response.base_classes.game_profile_object_response import GameProfileObjectResponse


class GetVideogameProfilesResponse(BaseModel):
    videogame_profiles: list[GameProfileObjectResponse]