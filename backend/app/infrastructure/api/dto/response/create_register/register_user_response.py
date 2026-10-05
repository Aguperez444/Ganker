from typing import Optional

from pydantic import BaseModel, Field


class RegisterUserResponse(BaseModel):
    user_id: int = Field(..., description="ID único del usuario registrado")
    username: str = Field(..., description="Nombre de usuario del usuario registrado")
    name: str = Field(..., description="Nombre completo del usuario registrado")
    mail: Optional[str] = Field(..., description="Correo electrónico del usuario registrado")
    role: str = Field(..., description="Rol asignado al usuario registrado")
