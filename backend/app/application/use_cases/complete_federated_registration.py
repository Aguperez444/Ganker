from datetime import datetime, timezone

from app.application.ports.i_federated_state_service import IFederatedStateService
from app.application.ports.i_token_service import ITokenService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.federated_auth.federated_account_already_linked_exception import (
    FederatedAccountAlreadyLinkedException,
)
from app.domain.exceptions.mail.email_already_exists_exception import EmailAlreadyExistsException
from app.domain.exceptions.user.invalid_username_exception import InvalidUsernameException
from app.domain.exceptions.user.username_already_exists_exception import UsernameAlreadyExistsException
from app.domain.models.discord_account_link import DiscordAccount, DiscordAccountLink, DiscordVisibility
from app.domain.models.federated_identity import FederatedIdentity, FederatedProvider
from app.domain.models.user import User
from app.domain.models.user_role import UserRole
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.services.static_validation_service import StaticValidationService
from app.infrastructure.api.dto.request.federated_auth_request import CompleteFederatedRegistrationRequest
from app.infrastructure.api.dto.response.auth_tokens_response import AuthTokensResponse


class CompleteFederatedRegistration:
    """
    Paso final del registro con identidad federada:
    Valida el token de registro temporal, comprueba que el username (y mail si aplica) estén disponibles,
    crea el usuario de Ganker sin contraseña local, asocia la identidad federada (y el perfil de Discord si aplica)
    y emite los tokens de sesión.
    """

    def __init__(self, state_service: IFederatedStateService, token_service: ITokenService, uow: IUnitOfWork):
        self.state_service: IFederatedStateService = state_service
        self.token_service: ITokenService = token_service
        self.uow: IUnitOfWork = uow

    def execute(self, request: CompleteFederatedRegistrationRequest) -> AuthTokensResponse:
        account = self.state_service.decode_registration_token(request.registration_token)

        StaticValidationService.validate_username_format(request.username)
        clean_username = request.username.strip()
        clean_name = (request.name or "").strip()
        if not clean_name:
            raise InvalidUsernameException(request.name)

        final_mail: str | None = None
        if request.mail and str(request.mail).strip():
            final_mail = str(request.mail).strip()
        elif account.email and account.email.strip():
            final_mail = account.email.strip()

        with self.uow as uow:
            existing_identity = uow.federated_identity_repo.get_by_provider_and_external_id(
                account.provider, account.provider_user_id
            )
            if existing_identity is not None:
                raise FederatedAccountAlreadyLinkedException(account.provider.label)

            if account.provider == FederatedProvider.DISCORD:
                existing_discord_link = uow.discord_account_link_repo.get_by_discord_user_id(account.provider_user_id)
                if existing_discord_link is not None:
                    raise FederatedAccountAlreadyLinkedException(account.provider.label)

            if CatalogValidationService.is_duplicated_username(clean_username, uow=uow):
                raise UsernameAlreadyExistsException(clean_username)

            if final_mail and CatalogValidationService.is_duplicated_mail(final_mail, uow=uow):
                raise EmailAlreadyExistsException(final_mail)

            new_player = User(
                user_id=None,
                username=clean_username,
                name=clean_name,
                mail=final_mail,
                password_hash=None,
                role=UserRole.PLAYER,
                profiles=[],
                icon_url=account.avatar_url,
                last_connection=datetime.now(timezone.utc).replace(tzinfo=None),
            )
            registered_player = uow.user_repo.create_user(new_player)
            player_id = registered_player.user_id
            role = registered_player.role

            uow.federated_identity_repo.save(
                FederatedIdentity(
                    identity_id=None,
                    user_id=player_id,
                    provider=account.provider,
                    provider_user_id=account.provider_user_id,
                    email=final_mail,
                    linked_at=datetime.now(timezone.utc).replace(tzinfo=None),
                )
            )

            if account.provider == FederatedProvider.DISCORD:
                uow.discord_account_link_repo.save(
                    DiscordAccountLink(
                        link_id=None,
                        user_id=player_id,
                        account=DiscordAccount(
                            discord_user_id=account.provider_user_id,
                            username=account.username,
                            global_name=account.display_name,
                            avatar_url=account.avatar_url,
                        ),
                        visibility=DiscordVisibility.TEAMMATES,
                        linked_at=datetime.now(timezone.utc).replace(tzinfo=None),
                    )
                )

            access_token, refresh_token, jti, expires_at = self.token_service.generate_tokens(
                user_id=player_id,
                role=role,
            )
            uow.refresh_token_repo.save(
                user_id=player_id,
                role=role,
                jti=jti,
                expires_at=expires_at,
            )

        return AuthTokensResponse(access_token, refresh_token)
