from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.response.delete.delete_region_response import DeleteRegionResponse
from app.domain.exceptions.region.region_not_found_exception import RegionNotFoundException


class DeleteRegion:
    def __init__(self, storage_service: IStorageService, uow: IUnitOfWork):
        self.storage_service: IStorageService = storage_service
        self.uow: IUnitOfWork = uow

    def execute(self, region_id: int) -> DeleteRegionResponse:
        with self.uow as uow:
            region_to_delete = uow.region_repo.get_region_by_id(region_id)
            if not region_to_delete:
                raise RegionNotFoundException(region_id)

            # Validar si existen jugadores asociados a la region
            associated_count = uow.region_repo.count_associated_to_region(region_id)
            if associated_count > 0:
                # Al eliminar la region, desvincular la region de los perfiles de juego
                uow.game_profile_repo.delete_region(region_id)

            uow.region_repo.delete_region(region_id)
        return DeleteRegionResponse(message='La region ha sido eliminada exitosamente')