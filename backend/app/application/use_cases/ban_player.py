from datetime import datetime, timedelta

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.moderation.cannot_ban_self_exception import CannotBanSelfException
from app.domain.models.user_ban_record import UserBanRecord
from app.domain.services.catalog_validation_service import CatalogValidationService

from app.infrastructure.api.dto.request.ban_player_request import BanPlayerRequest


class BanPlayer:

    def __init__(self, uow: IUnitOfWork):
        self.uow = uow

    def execute(self, ban_request: BanPlayerRequest, admin_id: int):
        if admin_id == ban_request.player_id:
            raise CannotBanSelfException()

        with self.uow as uow:
            admin_user = CatalogValidationService.get_and_validate_exist_user(admin_id, uow)
            reported_user = CatalogValidationService.get_and_validate_exist_user(ban_request.player_id, uow)

            new_ban_record = UserBanRecord(
                user_ban_record_id=None,
                banned_user=reported_user,
                banned_by_user=admin_user,
                reason=ban_request.reason,
                created_at=datetime.now(),
                expires_at=datetime.now() + timedelta(days=ban_request.duration_days)
            )

            uow.moderation_repo.ban_user(new_ban_record)