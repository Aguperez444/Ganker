import hashlib
from datetime import datetime, timezone

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.auth.invalid_email_change_token_exception import InvalidEmailChangeTokenException
from app.domain.services.catalog_validation_service import CatalogValidationService


class ConfirmEmailChange:
    def __init__(self, uow: IUnitOfWork):
        self.uow = uow

    def execute(self, raw_token: str) -> None:
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        with self.uow as uow:
            email_change = uow.pending_email_change_repo.get_by_token_hash(token_hash)
            if email_change is None:
                raise InvalidEmailChangeTokenException()
            # Serializa la confirmación con nuevas solicitudes para la misma cuenta.
            user = uow.user_repo.get_user_by_id(email_change.user_id, for_update=True)
            if user is None:
                raise InvalidEmailChangeTokenException()
            expiration = email_change.expires_at
            if expiration.tzinfo is None:
                expiration = expiration.replace(tzinfo=timezone.utc)
            if expiration <= datetime.now(timezone.utc):
                raise InvalidEmailChangeTokenException()
            CatalogValidationService.validate_mail_uniqueness(email_change.mail, user.user_id, uow)
            if not uow.pending_email_change_repo.consume(token_hash):
                raise InvalidEmailChangeTokenException()
            uow.user_repo.update_user_email(user.user_id, email_change.mail)
            uow.reset_token_repo.invalidate_all_user_tokens(user.user_id)
