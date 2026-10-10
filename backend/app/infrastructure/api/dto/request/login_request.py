from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    mail: EmailStr = Field(..., description="Correo electrónico del usuario")
    password: str = Field(..., description="Contraseña del usuario")
