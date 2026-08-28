from pydantic import BaseModel, Field

class UpdateVideogameRequest(BaseModel):
    name: str = Field(..., description="Nombre del videojuego a actualizar")