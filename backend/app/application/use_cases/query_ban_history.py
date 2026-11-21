from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.ban_appeal.ban_record_not_found_exception import (
    BanRecordNotFoundException,
)
from app.domain.exceptions.ban_appeal.ban_reference_not_owned_exception import (
    BanReferenceNotOwnedException,
)
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.infrastructure.api.dto.response.ban_appeal_response import BanAppealResponse
from app.infrastructure.api.dto.response.ban_record_detail_response import (
    BanRecordResponse, BanRecordDetailResponse, PlayerBanHistoryResponse,
)


class QueryBanHistory:
    def __init__(self, uow: IUnitOfWork):
        self.uow = uow

    def get_detail(self, ban_id: int):
        with self.uow as uow:
            result = uow.moderation_repo.get_ban_record(ban_id)
            if result is None:
                raise BanRecordNotFoundException()
            summary = BanRecordResponse.from_record(*result)
            appeal = uow.ban_appeal_repo.get_by_ban(ban_id)
            return BanRecordDetailResponse(
                **summary.model_dump(), appeal=BanAppealResponse.from_domain(appeal) if appeal else None,
            )

    def execute(self, user_id: int, before_ban_id: int | None = None, skip: int = 0, limit: int = 10):
        with self.uow as uow:
            CatalogValidationService.get_and_validate_exist_user(user_id, uow)
            if before_ban_id is not None:
                pivot = uow.moderation_repo.get_ban_record(before_ban_id)
                if pivot is None or pivot[0].banned_user.user_id != user_id:
                    raise BanReferenceNotOwnedException()
            records = uow.moderation_repo.get_player_ban_history(user_id, before_ban_id, skip, limit)
            return PlayerBanHistoryResponse(bans=[BanRecordResponse.from_record(*record) for record in records])
