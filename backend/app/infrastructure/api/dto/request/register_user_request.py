from pydantic import BaseModel, EmailStr, Field
from app.domain.models.user_role import UserRole


class RegisterUserRequest(BaseModel):
    name: str = Field(..., description="Nombre completo del usuario")
    username: str = Field(..., description="Nombre de usuario único")
    mail: EmailStr = Field(..., description="Correo electrónico del usuario")
    password: str = Field(..., description="Contraseña del usuario")
    role: UserRole = Field(..., description="Rol del usuario (player, admin u owner)")  # esto asegura que lo que venga en rol sea solo un str igual a player, admin u owner, y rechaza cualquier otro valor
