from pydantic import BaseModel, Field
from typing import List


class UpdateGameProfileResponse(BaseModel):
    profile_id: int = Field(..., description="ID único del perfil de juego actualizado")