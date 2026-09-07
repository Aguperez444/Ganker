from pydantic import BaseModel, EmailStr
from app.domain.models.user_role import UserRole


class RegisterUserRequest(BaseModel):
    name: str
    username: str
    mail: EmailStr
    password: str
    role: UserRole # esto asegura que lo que venga en rol sea solo un str igual a player, admin u owner, y rechaza cualquier otro valor