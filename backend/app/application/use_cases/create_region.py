from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.response.base_classes.region_object_response import RegionObjectResponse
from app.domain.exceptions.region.duplicated_region_name_exception import DuplicatedRegionNameException
from app.domain.exceptions.region.invalid_region_name_exception import InvalidRegionNameException
from app.domain.models.region import Region
from app.domain.services.catalog_validation_service import CatalogValidationService


class CreateRegion:
    def __init__(self, storage_service: IStorageService, uow: IUnitOfWork):
        self.storage_service = storage_service
        self.uow: IUnitOfWork = uow

    def execute(self, game_id:int, name:str):

        if not name.strip():
            raise InvalidRegionNameException(name)

        with self.uow as uow:
            game = CatalogValidationService.get_and_validate_exist_videogame(game_id, uow)

            if uow.region_repo.get_region_by_name_and_videogame(name,game_id):
                raise DuplicatedRegionNameException(name)

            try:
                new_region = Region(region_id=None, name=name, videogame=game)
                saved_region = uow.region_repo.save_region(new_region)
            except Exception as e:
                raise e

            return RegionObjectResponse(
                region_id=saved_region.region_id,
                name=saved_region.name
            )