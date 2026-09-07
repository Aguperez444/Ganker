from pydantic import BaseModel, Field


class CreateGameProfileResponse(BaseModel):
    profile_id: int = Field(..., description="ID único del perfil de juego recién creado")