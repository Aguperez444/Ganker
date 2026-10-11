from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.response.delete.delete_region_response import DeleteRegionResponse
from app.domain.services.catalog_validation_service import CatalogValidationService


class DeleteRegion:
    def __init__(self, storage_service: IStorageService, uow: IUnitOfWork):
        self.storage_service: IStorageService = storage_service
        self.uow: IUnitOfWork = uow

    def execute(self, region_id: int) -> DeleteRegionResponse:
        with self.uow as uow:
            CatalogValidationService.get_and_validate_exists_region(region_id, uow)

            # Validar si existen jugadores asociados a la region
            associated_count = uow.region_repo.count_associated_to_region(region_id)
            if associated_count > 0:
                # Al eliminar la region, desvincular la region de los perfiles de juego
                uow.game_profile_repo.disassociate_region(region_id)

            uow.region_repo.delete_region(region_id)
        return DeleteRegionResponse(message='La region ha sido eliminada exitosamente')