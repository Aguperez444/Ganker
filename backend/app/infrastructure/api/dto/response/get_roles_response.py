from pydantic import BaseModel

from app.infrastructure.api.dto.response.base_classes.role_object_response import RoleObjectResponse


class GetRolesResponse(BaseModel):
    roles : list[RoleObjectResponse]