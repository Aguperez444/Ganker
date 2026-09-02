from pydantic import BaseModel

from app.infrastructure.api.dto.rank_object_response import RankObjectResponse

class GetRanksResponse(BaseModel):
    ranks : list[RankObjectResponse]