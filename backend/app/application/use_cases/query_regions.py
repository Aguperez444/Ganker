from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.response.base_classes.region_object_response import RegionObjectResponse
from app.infrastructure.api.dto.response.get.get_regions_response import GetRegionsResponse


class QueryRegions:
    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def get_by_game_id(self, game_id: int) -> GetRegionsResponse:
        with self.uow as uow:
            regions = uow.region_repo.get_regions_by_game_id(game_id)

        regions_response = [RegionObjectResponse(region_id=region.region_id, name=region.name) for region in regions]
        return GetRegionsResponse(regions=regions_response)