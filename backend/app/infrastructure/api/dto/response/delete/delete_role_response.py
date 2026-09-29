from pydantic import BaseModel


class DeleteRoleResponse(BaseModel):
    message: str
