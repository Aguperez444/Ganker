from pydantic import BaseModel


class RegionObjectResponse(BaseModel):
    region_id: int
    name: str