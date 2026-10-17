from pydantic import BaseModel, Field


class DeleteUserResponse(BaseModel):
    message: str = Field(..., description="Mensaje de confirmación de eliminación del usuario")
