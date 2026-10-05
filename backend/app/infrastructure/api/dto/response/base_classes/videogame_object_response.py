from pydantic import BaseModel, Field

class VideogameObjectResponse(BaseModel):
    id: int = Field(..., description="ID único del videojuego")
    name: str = Field(..., description="Nombre del videojuego")
    icon_url: str = Field(..., description="URL del ícono del videojuego")
    rank_per_role: bool = Field(..., description="Indica si el videojuego rankea a los jugadores por rol")
