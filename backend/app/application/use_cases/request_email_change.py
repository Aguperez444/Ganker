import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from typing import cast
from app.application.ports.i_password_hasher import IPasswordHasher
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.auth.invalid_current_password_exception import InvalidCurrentPasswordException
from app.domain.exceptions.domain_exception import DomainException
from app.domain.exceptions.user.user_not_found_exception import UserNotFoundException
from app.domain.models.pending_email_change import PendingEmailChange
from app.domain.services.catalog_validation_service import CatalogValidationService


class RequestEmailChange:
    def __init__(self, uow: IUnitOfWork, password_hasher: IPasswordHasher):
        self.uow = uow
        self.password_hasher = password_hasher

    def execute(self, user_id: int, mail: str, password: str) -> str:
        mail = mail.strip().lower()
        with self.uow as uow:
            user = uow.user_repo.get_user_by_id(user_id, for_update=True)
            if user is None:
                raise UserNotFoundException(user_id)
            if not user.password_hash or not self.password_hasher.verify_password(password, cast(str, user.password_hash)):
                raise InvalidCurrentPasswordException()
            if user.mail and mail == user.mail.strip().lower():
                raise DomainException(message="El nuevo email debe ser diferente al actual.", status_code=400)
            CatalogValidationService.validate_mail_uniqueness(mail, user_id, uow) # tira la exception si no es único

            # generar token y guardarlo en pending_email_change
            raw_token = secrets.token_urlsafe(32)
            uow.pending_email_change_repo.save(PendingEmailChange(
                pending_email_change_id=None,
                user_id=user_id,
                mail=mail,
                token_hash=hashlib.sha256(raw_token.encode("utf-8")).hexdigest(),
                expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
            ))
        return raw_token
