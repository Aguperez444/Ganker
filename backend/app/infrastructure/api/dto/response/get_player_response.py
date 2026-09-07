from typing import List

from pydantic import BaseModel, Field

from app.infrastructure.api.dto.response.base_classes.game_profile_object_response import GameProfileObjectResponse


class GetUserResponse(BaseModel):
    name: str = Field(..., description="Nombre del jugador")
    username: str = Field(..., description="Nombre de usuario del jugador")
    mail: str|None = Field(..., description="Correo electrónico del jugador")
    profiles: List[GameProfileObjectResponse] = Field(..., description="Perfiles de juego del jugador")
    role: str = Field(..., description="Rol del jugador")
    icon_url: str = "/media/users/icons/icon_example_1.png"
