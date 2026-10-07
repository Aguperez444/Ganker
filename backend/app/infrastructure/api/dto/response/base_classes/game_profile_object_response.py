from typing import List
from pydantic import BaseModel, Field
from app.infrastructure.api.dto.response.base_classes.character_object_response import CharacterObjectResponse
from app.infrastructure.api.dto.response.base_classes.region_object_response import RegionObjectResponse
from app.infrastructure.api.dto.response.base_classes.role_profile_object_response import RoleProfileObjectResponse
from app.infrastructure.api.dto.response.base_classes.videogame_object_response import VideogameObjectResponse

class GameProfileObjectResponse(BaseModel):
    game_profile_id: int = Field(..., description="ID único del perfil de juego")
    player_id: int = Field(..., description="ID del jugador asociado al perfil de juego")
    videogame: VideogameObjectResponse = Field(..., description="Videojuego asociado al perfil de juego")
    characters: List[CharacterObjectResponse] = Field(..., description="Personajes asociados al perfil de juego")
    role_profiles: List['RoleProfileObjectResponse'] = Field(..., description="Perfiles de rol asociados al perfil de juego")
    region: RegionObjectResponse | None = Field(..., description="Region de juego asociado al perfil de juego")
