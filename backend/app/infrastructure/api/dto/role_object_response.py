from pydantic import BaseModel

class RoleObjectResponse(BaseModel):
    role_id: int
    name: str