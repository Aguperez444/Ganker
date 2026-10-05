from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.response.base_classes.region_object_response import RegionObjectResponse
from app.domain.exceptions.region.duplicated_region_name_exception import DuplicatedRegionNameException
from app.domain.services.static_validation_service import StaticValidationService
from app.domain.models.region import Region
from app.domain.services.catalog_validation_service import CatalogValidationService


class CreateRegion:
    def __init__(self, storage_service: IStorageService, uow: IUnitOfWork):
        self.storage_service = storage_service
        self.uow: IUnitOfWork = uow

    def execute(self, game_id:int, name:str):

        name = StaticValidationService.validate_region_name_format(name)

        with self.uow as uow:
            game = CatalogValidationService.get_and_validate_exist_videogame(game_id, uow)

            CatalogValidationService.validate_region_name_uniqueness(name, game_id, uow)

            new_region = Region(region_id=None, name=name, videogame=game)
            saved_region = uow.region_repo.save_region(new_region)


            return RegionObjectResponse(
                region_id=saved_region.region_id,
                name=saved_region.name
            )