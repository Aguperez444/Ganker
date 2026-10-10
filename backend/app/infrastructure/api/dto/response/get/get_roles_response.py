from pydantic import BaseModel, Field

from app.infrastructure.api.dto.response.base_classes.role_object_response import RoleObjectResponse


class GetRolesResponse(BaseModel):
    roles: list[RoleObjectResponse] = Field(..., description="Lista de roles del videojuego")
