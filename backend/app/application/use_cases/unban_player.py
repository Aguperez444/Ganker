from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.moderation.cannot_unban_self_exception import CannotUnbanSelfException
from app.domain.services.catalog_validation_service import CatalogValidationService


class UnbanPlayer:
    def __init__(self, uow: IUnitOfWork):
        self.uow = uow

    def execute(self, player_id: int, admin_id: int):

        with self.uow as uow:
            CatalogValidationService.get_and_validate_exist_user(player_id, uow)
            CatalogValidationService.get_and_validate_exist_user(admin_id, uow)

            if player_id == admin_id:
                raise CannotUnbanSelfException()

            uow.moderation_repo.manual_unban_user(player_id)