from pydantic import BaseModel, Field


class DeleteGameProfileResponse(BaseModel):
    message: str = Field(..., description="Mensaje de confirmación de eliminación del perfil de juego")
