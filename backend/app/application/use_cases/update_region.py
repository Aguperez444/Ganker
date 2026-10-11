from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.response.base_classes.region_object_response import RegionObjectResponse
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.services.static_validation_service import StaticValidationService


class UpdateRegion:

    def __init__(self, storage_service: IStorageService, uow: IUnitOfWork):
        self.storage_service = storage_service
        self.uow: IUnitOfWork = uow

    def execute(self, region_id:int, name:str) -> RegionObjectResponse:

        cleaned_name = StaticValidationService.validate_region_name_format(name)

        with self.uow as uow:
            existing_region = CatalogValidationService.get_and_validate_exists_region(region_id, uow)

            game_id = existing_region.videogame.videogame_id
            CatalogValidationService.validate_region_name_uniqueness(cleaned_name, game_id, uow)

            existing_region.name = cleaned_name

            update_region = uow.region_repo.update_region(existing_region)


        return RegionObjectResponse(
            region_id=update_region.region_id,
            name=update_region.name
        )