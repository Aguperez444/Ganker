from pydantic import BaseModel, Field

class RegisterVideogameRequest(BaseModel):
    name: str = Field(..., description="Nombre del videojuego a registrar")