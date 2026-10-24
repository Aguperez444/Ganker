from datetime import datetime, timedelta, timezone

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.domain_exception import DomainException
from app.domain.exceptions.moderation.cannot_ban_self_exception import CannotBanSelfException
from app.domain.models.user_ban_record import UserBanRecord
from app.domain.models.user_role import UserRole
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

            if admin_user.role not in (UserRole.ADMIN, UserRole.OWNER):
                raise DomainException("No tienes permisos suficientes para banear usuarios.", status_code=403)
            if reported_user.role == UserRole.OWNER or (
                admin_user.role == UserRole.ADMIN and reported_user.role == UserRole.ADMIN
            ):
                raise DomainException("No tienes permisos para banear a un usuario de igual o mayor jerarquía.", status_code=403)

            created_at = datetime.now(timezone.utc)
            try:
                expires_at = created_at + timedelta(days=ban_request.duration_days)
            except OverflowError:
                # Sin máximo de negocio: las duraciones que exceden datetime
                # se conservan cerca del máximo. Un día de margen evita llegar al
                # año 10000 al leer TIMESTAMPTZ desde una zona con offset positivo.
                expires_at = datetime.max.replace(tzinfo=timezone.utc) - timedelta(days=1)
            new_ban_record = UserBanRecord(
                user_ban_record_id=None,
                banned_user=reported_user,
                banned_by_user=admin_user,
                reason=ban_request.reason,
                created_at=created_at,
                expires_at=expires_at
            )

            uow.moderation_repo.ban_user(new_ban_record)
