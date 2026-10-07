from pydantic import BaseModel, Field

from app.infrastructure.api.dto.response.base_classes.rank_object_response import RankObjectResponse

class GetRanksResponse(BaseModel):
    ranks: list[RankObjectResponse] = Field(..., description="Lista de rangos del videojuego")
