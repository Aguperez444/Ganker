import hashlib
from datetime import datetime, timezone

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.reset_password.expire_reset_token_exception import ExpireResetTokenException
from app.domain.exceptions.reset_password.not_found_or_is_used_reset_token_exception import \
    NotFoundOrIsUsedResetTokenException
from app.domain.services.password_security_service import PasswordSecurityService
from app.infrastructure.api.auth.password_hash_service import PasswordHashService


class ResetPassword:

    def __init__(self, hasher: PasswordHashService, uow: IUnitOfWork) -> None:
        self.hasher = hasher
        self.uow = uow

    def execute(self, raw_token:str, new_password:str) -> None:

        token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
        PasswordSecurityService.validate(new_password)

        with self.uow as uow:
            reset_password_record = uow.reset_token_repo.get_by_token_hash(token_hash)
            if not reset_password_record or reset_password_record.is_used:
                raise NotFoundOrIsUsedResetTokenException()

            current_time = datetime.now(timezone.utc)
            token_expiration = reset_password_record.expires_at

            # Me aseguro que tenga UTC, si no lo tiene, se lo agrego
            if token_expiration.tzinfo is None:
                token_expiration = token_expiration.replace(tzinfo=timezone.utc)

            # Ahora comparo si está vencido
            if token_expiration < current_time:
                raise ExpireResetTokenException()

            # Hasheo la contraseña nueva
            new_hashed_password = self.hasher.hash_password(new_password)

            uow.user_repo.update_user_password(
                reset_password_record.user_id,
                new_hashed_password=new_hashed_password
            )
            uow.reset_token_repo.mark_as_used(reset_password_record.id)
            uow.reset_token_repo.invalidate_all_user_tokens(reset_password_record.user_id)
            uow.refresh_token_repo.revoke_all_by_user_id(reset_password_record.user_id)
