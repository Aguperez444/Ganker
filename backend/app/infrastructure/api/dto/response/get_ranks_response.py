from pydantic import BaseModel

from app.infrastructure.api.dto.response.base_classes.rank_object_response import RankObjectResponse

class GetRanksResponse(BaseModel):
    ranks : list[RankObjectResponse]