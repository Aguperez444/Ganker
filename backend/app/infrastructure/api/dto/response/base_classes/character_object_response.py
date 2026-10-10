from pydantic import BaseModel, Field

class CharacterObjectResponse(BaseModel):
    character_id: int = Field(..., description="ID único del personaje")
    name: str = Field(..., description="Nombre del personaje")
    icon_url: str = Field(..., description="URL del ícono del personaje")
