from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.response.base_classes.region_object_response import RegionObjectResponse
from app.domain.exceptions.region.duplicated_region_name_exception import DuplicatedRegionNameException
from app.domain.exceptions.region.invalid_region_name_exception import InvalidRegionNameException
from app.domain.services.catalog_validation_service import CatalogValidationService


class UpdateRegion:

    def __init__(self, storage_service: IStorageService, uow: IUnitOfWork):
        self.storage_service = storage_service
        self.uow: IUnitOfWork = uow

    def execute(self, region_id:int, name:str) -> RegionObjectResponse:

        if not name or not name.strip():
            raise InvalidRegionNameException(name)
        cleaned_name = name.strip()

        with self.uow as uow:
            existing_region = CatalogValidationService.get_and_validate_exists_region(region_id, uow)

            game_id = existing_region.videogame.videogame_id
            region_by_name = uow.region_repo.get_region_by_name_and_videogame(cleaned_name, game_id)
            if region_by_name and region_by_name.region_id != region_id:
                raise DuplicatedRegionNameException(cleaned_name)

            existing_region.name = cleaned_name

            try:
                update_region = uow.region_repo.update_region(existing_region)
            except Exception as e:
                raise e

        return RegionObjectResponse(
            region_id=update_region.region_id,
            name=update_region.name
        )