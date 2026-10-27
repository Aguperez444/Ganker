from datetime import datetime, timezone
from typing import TYPE_CHECKING

from app.application.ports.i_password_hasher import IPasswordHasher
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.application.services.registration_token_service import RegistrationTokenService
from app.domain.exceptions.mail.email_already_exists_exception import EmailAlreadyExistsException
from app.domain.exceptions.user.username_already_exists_exception import UsernameAlreadyExistsException
from app.domain.models.pending_registration import PendingRegistration
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.services.password_security_service import PasswordSecurityService
from app.domain.services.static_validation_service import StaticValidationService

if TYPE_CHECKING:
    from app.infrastructure.api.dto.request.register_player_request import RegisterPlayerRequest



class RegisterPlayer:
    def __init__(self, unit_of_work: IUnitOfWork, password_hasher: IPasswordHasher):
        self.uow: IUnitOfWork = unit_of_work
        self.pass_hasher: IPasswordHasher = password_hasher

    def execute(self, player_data: 'RegisterPlayerRequest') -> str:
        PasswordSecurityService.validate(player_data.password)
        StaticValidationService.validate_username_format(player_data.username)

        with self.uow as uow:
            if CatalogValidationService.is_duplicated_mail(player_data.mail, uow=uow):
                raise EmailAlreadyExistsException(player_data.mail)

            if CatalogValidationService.is_duplicated_username(player_data.username, uow=uow):
                raise UsernameAlreadyExistsException(player_data.username)

            hashed_pass = self.pass_hasher.hash_password(player_data.password)
            registration = PendingRegistration(
                registration_id=None,
                mail=str(player_data.mail).strip().lower(),
                username=player_data.username.strip(),
                name=player_data.name,
                password_hash=hashed_pass,
                token_hash="",
                expires_at=datetime.now(timezone.utc),
            )
            raw_token = RegistrationTokenService.renew(registration)
            uow.pending_registration_repo.save(registration)
            return raw_token
