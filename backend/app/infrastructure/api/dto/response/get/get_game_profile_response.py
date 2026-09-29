from datetime import datetime
from pydantic import BaseModel, Field
from typing import List

from app.infrastructure.api.dto.response.base_classes.character_object_response import CharacterObjectResponse
from app.infrastructure.api.dto.response.base_classes.role_profile_object_response import RoleProfileObjectResponse
from app.infrastructure.api.dto.response.base_classes.videogame_object_response import VideogameObjectResponse

class PlayerObjectResponse(BaseModel):
    player_id: int = Field(..., description="ID único del jugador")
    player_name: str = Field(..., description="Nombre del jugador")
    icon_url: str | None = Field("/media/users/icons/icon_example_1.png", description="URL del ícono del jugador")
    last_connection: datetime | None = Field(..., description="Última conexión del jugador")

class GetGameProfileResponse(BaseModel):
    game_profile_id: int = Field(..., description="ID único del perfil de juego")
    player: PlayerObjectResponse = Field(..., description="Jugador asociado al perfil de juego")
    videogame: VideogameObjectResponse = Field(..., description="Videojuego asociado al perfil de juego")
    characters: List[CharacterObjectResponse] = Field(..., description="Personajes asociados al perfil de juego")
    role_profiles: List['RoleProfileObjectResponse'] = Field(..., description="Perfiles de rol asociados al perfil de juego")
