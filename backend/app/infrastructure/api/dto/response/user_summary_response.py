from pydantic import BaseModel, Field


class UserSummaryResponse(BaseModel):
    user_id: int = Field(..., description="ID único del usuario")
    username: str = Field(..., description="Nombre de usuario")
    name: str = Field(..., description="Nombre del usuario")
    icon_url: str = Field(..., description="URL del ícono del usuario")
