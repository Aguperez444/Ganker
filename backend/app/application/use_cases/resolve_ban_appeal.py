from datetime import datetime, timezone

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.ban_appeal.ban_appeal_already_resolved_exception import (
    BanAppealAlreadyResolvedException,
)
from app.domain.exceptions.ban_appeal.ban_appeal_ban_not_active_exception import (
    BanAppealBanNotActiveException,
)
from app.domain.exceptions.ban_appeal.ban_appeal_not_found_exception import (
    BanAppealNotFoundException,
)
from app.domain.exceptions.ban_appeal.cannot_resolve_ban_appeal_exception import (
    CannotResolveBanAppealException,
)
from app.domain.exceptions.ban_appeal.insufficient_hierarchy_to_resolve_ban_appeal_exception import (
    InsufficientHierarchyToResolveBanAppealException,
)
from app.domain.exceptions.ban_appeal.invalid_ban_appeal_decision_exception import (
    InvalidBanAppealDecisionException,
)
from app.domain.models.ban_appeal import BanAppealStatus
from app.domain.models.user_role import UserRole
from app.domain.services.catalog_validation_service import CatalogValidationService


class ResolveBanAppeal:
    def __init__(self, uow: IUnitOfWork):
        self.uow = uow

    def execute(self, appeal_id: int, admin_id: int, decision: BanAppealStatus):
        if decision not in (BanAppealStatus.ACCEPTED, BanAppealStatus.REJECTED):
            raise InvalidBanAppealDecisionException()
        with self.uow as uow:
            appeal = uow.ban_appeal_repo.get_by_id(appeal_id, lock=True)
            if appeal is None:
                raise BanAppealNotFoundException()
            actor = CatalogValidationService.get_and_validate_exist_user(admin_id, uow)
            player = CatalogValidationService.get_and_validate_exist_user(appeal.ban.user_id, uow)
            if actor.role not in (UserRole.ADMIN, UserRole.OWNER) or actor.user_id == player.user_id:
                raise CannotResolveBanAppealException()
            if player.role == UserRole.OWNER or (actor.role == UserRole.ADMIN and player.role == UserRole.ADMIN):
                raise InsufficientHierarchyToResolveBanAppealException()
            if appeal.status != BanAppealStatus.PENDING:
                raise BanAppealAlreadyResolvedException()
            if not appeal.ban.active:
                raise BanAppealBanNotActiveException()
            if decision == BanAppealStatus.ACCEPTED:
                uow.moderation_repo.manual_unban_user(player.user_id, admin_id=actor.user_id, source="appeal")
            appeal.status = decision
            appeal.resolved_at = datetime.now(timezone.utc)
            appeal.resolver_user_id = actor.user_id
            return uow.ban_appeal_repo.save(appeal)
