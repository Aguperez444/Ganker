from datetime import datetime, timedelta

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.moderation.cannot_ban_self_exception import CannotBanSelfException
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.infrastructure.api.dto.request.ban_player_request import BanPlayerRequest
from app.infrastructure.database.models.users_banned import UsersBanned


class BanPlayer:

    def __init__(self, uow: IUnitOfWork):
        self.uow = uow

    def execute(self, ban_request: BanPlayerRequest, admin_id: int):

        with self.uow as uow:
            CatalogValidationService.get_and_validate_exist_user(admin_id, uow)
            CatalogValidationService.get_and_validate_exist_user(ban_request.player_id, uow)

            if admin_id == ban_request.player_id:
                raise CannotBanSelfException()

            new_register = UsersBanned(
                banned_user=ban_request.player_id,
                banned_by=admin_id,
                reason=ban_request.reason,
                expires_at=datetime.now() + timedelta(days=ban_request.duration_days)
            )

            uow.moderation_repo.ban_user(ban_request.player_id, admin_id, new_register)