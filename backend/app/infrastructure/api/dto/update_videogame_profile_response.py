from pydantic import BaseModel, Field
from typing import List

from app.infrastructure.api.dto.character_object_response import CharacterObjectResponse
from app.infrastructure.api.dto.role_profile_object_response import RoleProfileObjectResponse
from app.infrastructure.api.dto.videogame_object_response import VideogameObjectResponse


class UpdateGameProfileResponse(BaseModel):
    game_profile_id: int = Field(..., description="ID único del perfil de juego actualizado")
    player_id: int = Field(..., description="ID único del jugador del perfil de juego actualizado")
    videogame: VideogameObjectResponse = Field(..., description="Videojuego asociado al perfil de juego actualizado")
    characters: List[CharacterObjectResponse] = Field(..., description="Personajes asociados al perfil de juego actualizado")
    role_profiles: List['RoleProfileObjectResponse'] = Field(..., description="Perfiles de rol asociados al perfil de juego actualizado")