from pydantic import BaseModel, Field


class DeleteRoleResponse(BaseModel):
    message: str = Field(..., description="Mensaje de confirmación de eliminación del rol")
