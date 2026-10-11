from pydantic import BaseModel

from app.infrastructure.api.dto.response.base_classes.region_object_response import RegionObjectResponse


class GetRegionsResponse(BaseModel):
    regions: list[RegionObjectResponse]