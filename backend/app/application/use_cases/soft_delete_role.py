from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.infrastructure.api.dto.response.delete.delete_role_response import DeleteRoleResponse


class SoftDeleteRoleUseCase:
    def __init__(self, uow: IUnitOfWork):
        self.uow: IUnitOfWork = uow

    def execute(self, role_id: int) -> DeleteRoleResponse:
        with self.uow as uow:
            CatalogValidationService.get_and_validate_exist_role(role_id, uow)

            associated_count = uow.role_profile_repo.count_associated_to_role(role_id)
            if associated_count > 0:
                affected_profile_ids = uow.role_profile_repo.soft_delete_by_role_id(role_id)
                for profile_id in affected_profile_ids:
                    remaining_count = uow.role_profile_repo.count_by_game_profile_id(profile_id)
                    if remaining_count == 0:
                        uow.character_priority_repo.soft_delete_by_game_profile_id(profile_id)
                        uow.game_profile_repo.soft_delete_game_profile(profile_id)

            uow.role_repo.soft_delete_role(role_id)

        return DeleteRoleResponse(message="El rol ha sido eliminado exitosamente.")


SoftDeleteRole = SoftDeleteRoleUseCase
