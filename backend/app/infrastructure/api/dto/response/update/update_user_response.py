from typing import Optional

from pydantic import BaseModel, Field


class UpdateUserResponse(BaseModel):
    user_id: int = Field(..., description="ID único del usuario actualizado")
    username: str = Field(..., description="Nombre de usuario actualizado")
    name: str = Field(..., description="Nombre completo actualizado")
    mail: Optional[str] = Field(..., description="Correo electrónico actualizado")
    icon_url: Optional[str] = Field(..., description="URL del ícono actualizado del usuario")
