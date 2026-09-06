from typing import List

from pydantic import BaseModel, Field

from app.infrastructure.api.dto.game_profile_object_response import GameProfileObjectResponse


class GetPlayerResponse(BaseModel):
    name: str = Field(..., description="Nombre del jugador")
    username: str = Field(..., description="Nombre de usuario del jugador")
    mail: str|None = Field(..., description="Correo electrónico del jugador")
    profiles: List[GameProfileObjectResponse] = Field(..., description="Perfiles de juego del jugador")
    icon_url: str = "/media/users/icons/icon_example_1.png"

    def __init__(self, **data):
        super().__init__(**data)
        print('\n'*3)
        print('-'*100)
        print("IMPLEMENTAR EL ICON_URL DEL JUGADOR EN LA RESPUESTA DE GET_PLAYER_RESPONSE")
        print("TODAVÍA SE ESTA USANDO EL ICON_URL POR DEFECTO, SE DEBE OBTENER EL ICON_URL DEL JUGADOR DESDE LA BASE DE DATOS")
        print("TODAVÍA NO SE IMPLEMENTÓ EL ICON_URL DEL JUGADOR")
        print('-'*100)
        print('\n' * 3)
