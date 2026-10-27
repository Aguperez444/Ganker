import hashlib
from datetime import datetime, timezone

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.auth.invalid_registration_token_exception import InvalidRegistrationTokenException
from app.domain.exceptions.mail.email_already_exists_exception import EmailAlreadyExistsException
from app.domain.exceptions.user.username_already_exists_exception import UsernameAlreadyExistsException
from app.domain.models.user import User
from app.domain.models.user_role import UserRole
from app.domain.services.catalog_validation_service import CatalogValidationService


class ConfirmRegistration:
    def __init__(self, uow: IUnitOfWork):
        self.uow = uow

    def execute(self, raw_token: str) -> None:
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        with self.uow as uow:
            registration = uow.pending_registration_repo.get_by_token_hash(token_hash)
            if registration is None:
                raise InvalidRegistrationTokenException()

            expiration = registration.expires_at
            if expiration.tzinfo is None:
                expiration = expiration.replace(tzinfo=timezone.utc)
            if expiration <= datetime.now(timezone.utc):
                raise InvalidRegistrationTokenException()

            # Los datos pueden haberse ocupado después de solicitar el registro.
            if CatalogValidationService.is_duplicated_mail(registration.mail, uow=uow):
                raise EmailAlreadyExistsException(registration.mail)
            if CatalogValidationService.is_duplicated_username(registration.username, uow=uow):
                raise UsernameAlreadyExistsException(registration.username)

            # Este méto.do "consume" el token de registro, eliminándolo de la bdd, sí, en cambio, no lo encuentra,
            # significa que ya fue consumido y, por lo tanto, es inválido.
            # O, directamente jamás existió, lo que también lo hace inválido.
            if not uow.pending_registration_repo.consume(token_hash):
                raise InvalidRegistrationTokenException()
            # si no es invalido, entonces se crea el usuario en la bdd y se le asigna el rol de jugador.
            uow.user_repo.create_user(User(
                None, registration.username, registration.name, registration.mail,
                registration.password_hash, UserRole.PLAYER, [],
            ))
