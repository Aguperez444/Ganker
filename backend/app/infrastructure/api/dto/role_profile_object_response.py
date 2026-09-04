from pydantic import BaseModel, Field

from app.infrastructure.api.dto.rank_object_response import RankObjectResponse
from app.infrastructure.api.dto.role_object_response import RoleObjectResponse


class RoleProfileObjectResponse(BaseModel):
    role_profile_id: int = Field(..., description="ID único del perfil de rol")
    role: RoleObjectResponse = Field(..., description="Rol asociado al perfil")
    rank: RankObjectResponse = Field(..., description="Rango del perfil de rol")
