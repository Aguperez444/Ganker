from pydantic import BaseModel, EmailStr, Field


class RegisterPlayerRequest(BaseModel):
    name: str = Field(..., description="Nombre completo del jugador")
    username: str = Field(..., description="Nombre de usuario único del jugador")
    mail: EmailStr = Field(..., description="Correo electrónico del jugador")
    password: str = Field(..., description="Contraseña del jugador")
