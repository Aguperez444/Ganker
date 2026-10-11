from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.infrastructure.api.dto.response.delete.delete_role_response import DeleteRoleResponse


class DeleteRole:
    def __init__(self, storage_service: IStorageService, uow: IUnitOfWork):
        self.storage_service: IStorageService = storage_service
        self.uow: IUnitOfWork = uow

    def execute(self, role_id: int) -> DeleteRoleResponse:
        with self.uow as uow:
            role_to_delete = CatalogValidationService.get_and_validate_exist_role(role_id, uow)

            # Validar si existen jugadores o perfiles asociados actualmente al rol
            associated_count = uow.role_profile_repo.count_associated_to_role(role_id)
            if associated_count > 0:
                # Eliminar todos los roleProfiles asignados al rol eliminado
                affected_profile_ids = uow.role_profile_repo.delete_by_role_id(role_id)

                # Si un gameProfile queda sin roleProfiles tras la eliminacion, debe eliminarse también
                for profile_id in affected_profile_ids:
                    remaining_count = uow.role_profile_repo.count_by_game_profile_id(profile_id)
                    if remaining_count == 0:
                        uow.game_profile_repo.delete_game_profile(profile_id)

            # Eliminar el rol del sistema
            uow.role_repo.delete_role(role_id)

            # Limpiar archivo de ícono en almacenamiento si existe
            # noinspection broad-exception
            try:
                if role_to_delete.icon_url:
                        self.storage_service.delete_file(role_to_delete.icon_url)
            except Exception:
                from colorama import Fore, Style
                print(Fore.RED + "-" * 70 + "\n" + f"Error inesperado al borrar la imagen anterior del usuario: {role_to_delete.icon_url} \n" + "-" * 70 + "\n" + Style.RESET_ALL)

        return DeleteRoleResponse(message="El rol ha sido eliminado exitosamente.")
