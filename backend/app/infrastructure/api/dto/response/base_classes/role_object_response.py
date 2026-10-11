from pydantic import BaseModel, Field

class RoleObjectResponse(BaseModel):
    role_id: int = Field(..., description="ID único del rol")
    name: str = Field(..., description="Nombre del rol")
    icon_url: str = Field(..., description="URL del ícono del rol")
