from datetime import datetime
from typing import List

from pydantic import BaseModel, Field

from app.infrastructure.api.dto.response.base_classes.game_profile_object_response import GameProfileObjectResponse


class GetPublicUserResponse(BaseModel):
    """Perfil de un jugador visto por otro jugador: sin datos privados como el mail."""
    user_id: int = Field(..., description="ID único del jugador")
    name: str = Field(..., description="Nombre del jugador")
    username: str = Field(..., description="Nombre de usuario del jugador")
    profiles: List[GameProfileObjectResponse] = Field(..., description="Perfiles de juego del jugador")
    icon_url: str = Field("/media/users/icons/icon_example_1.png", description="URL del ícono del jugador")
    last_connection: datetime | None = Field(..., description="Última conexión del jugador")
