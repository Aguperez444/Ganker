from pydantic import BaseModel, Field


class DeleteVideogameResponse(BaseModel):
    message: str = Field(..., description="Mensaje de confirmación de eliminación del videojuego")
