from datetime import datetime
from typing import Optional

from app.application.ports.i_federated_auth_provider import IFederatedAuthProviderResolver
from app.application.ports.i_federated_state_service import IFederatedStateService
from app.application.ports.i_token_service import ITokenService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.models.discord_account_link import DiscordAccount, DiscordAccountLink, DiscordVisibility
from app.domain.models.federated_identity import FederatedAccount, FederatedIdentity, FederatedProvider
from app.domain.models.user import User
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.infrastructure.api.dto.request.federated_auth_request import FederatedCallbackRequest
from app.infrastructure.api.dto.response.federated_auth_response import FederatedCallbackResponse


class AuthenticateFederatedUser:
    """
    Segundo paso del inicio de sesión o registro federado:
    - Si la identidad externa ya está vinculada a un usuario (o coincide con un Discord ya vinculado,
      o el correo verificado coincide con una cuenta existente), inicia sesión directamente.
    - Si es la primera vez que entra y no hay cuenta previa, devuelve un token de registro temporal
      con los datos sugeridos para que el jugador elija su username y nombre antes de crear la cuenta.
    """

    def __init__(self, provider_resolver: IFederatedAuthProviderResolver, state_service: IFederatedStateService,
                 token_service: ITokenService, uow: IUnitOfWork):
        self.provider_resolver: IFederatedAuthProviderResolver = provider_resolver
        self.state_service: IFederatedStateService = state_service
        self.token_service: ITokenService = token_service
        self.uow: IUnitOfWork = uow

    def execute(self, provider_name: str, request: FederatedCallbackRequest) -> FederatedCallbackResponse:
        provider_adapter = self.provider_resolver.resolve(provider_name)
        self.state_service.validate_state(request.state, provider_adapter.provider)
        account = provider_adapter.exchange_callback(code=request.code, openid_params=request.openid_params)

        with self.uow as uow:
            user = self._find_and_link_existing_user(uow, account)
            if user is not None:
                self._sync_discord_profile_link_if_applicable(uow, user.user_id, account)
                access_token, refresh_token, jti, expires_at = self.token_service.generate_tokens(
                    user_id=user.user_id,
                    role=user.role,
                )
                uow.refresh_token_repo.save(
                    user_id=user.user_id,
                    role=user.role,
                    jti=jti,
                    expires_at=expires_at,
                )
                user.last_connection = datetime.now()
                uow.user_repo.update_user(user)

                return FederatedCallbackResponse(
                    status="authenticated",
                    provider=account.provider.value,
                    access_token=access_token,
                    refresh_token=refresh_token,
                    token_type="bearer",
                )

            suggested_username = self._build_unique_username(uow, account.username)
            registration_token = self.state_service.create_registration_token(account)

            return FederatedCallbackResponse(
                status="needs_registration",
                provider=account.provider.value,
                registration_token=registration_token,
                suggested_username=suggested_username,
                suggested_name=account.suggested_name,
                email=account.email,
                avatar_url=account.avatar_url,
            )

    @staticmethod
    def _find_and_link_existing_user(uow: IUnitOfWork, account: FederatedAccount) -> Optional[User]:
        # 1. Buscar por identidad federada previamente vinculada
        identity = uow.federated_identity_repo.get_by_provider_and_external_id(
            account.provider, account.provider_user_id
        )
        if identity is not None:
            user = uow.user_repo.get_user_by_id(identity.user_id)
            if user is not None:
                return user

        # 2. Si el proveedor es Discord, reconocer cuentas que ya hayan vinculado ese Discord en su perfil
        if account.provider == FederatedProvider.DISCORD:
            discord_link = uow.discord_account_link_repo.get_by_discord_user_id(account.provider_user_id)
            if discord_link is not None:
                user = uow.user_repo.get_user_by_id(discord_link.user_id)
                if user is not None:
                    existing_for_provider = uow.federated_identity_repo.get_by_user_and_provider(
                        user.user_id, FederatedProvider.DISCORD
                    )
                    if existing_for_provider is None:
                        uow.federated_identity_repo.save(
                            FederatedIdentity(
                                identity_id=None,
                                user_id=user.user_id,
                                provider=FederatedProvider.DISCORD,
                                provider_user_id=account.provider_user_id,
                                email=account.email,
                                linked_at=datetime.now(),
                            )
                        )
                    return user

        # 3. Si el proveedor devolvió un email verificado que coincide con una cuenta existente, asociar y entrar
        if account.email:
            user_by_mail = uow.user_repo.get_user_by_mail(account.email)
            if user_by_mail is not None:
                existing_for_provider = uow.federated_identity_repo.get_by_user_and_provider(
                    user_by_mail.user_id, account.provider
                )
                if existing_for_provider is None:
                    uow.federated_identity_repo.save(
                        FederatedIdentity(
                            identity_id=None,
                            user_id=user_by_mail.user_id,
                            provider=account.provider,
                            provider_user_id=account.provider_user_id,
                            email=account.email,
                            linked_at=datetime.now(),
                        )
                    )
                return user_by_mail

        return None

    @staticmethod
    def _sync_discord_profile_link_if_applicable(uow: IUnitOfWork, user_id: int, account: FederatedAccount) -> None:
        if account.provider != FederatedProvider.DISCORD:
            return
        current_link = uow.discord_account_link_repo.get_by_user_id(user_id)
        if current_link is not None:
            return
        linked_elsewhere = uow.discord_account_link_repo.get_by_discord_user_id(account.provider_user_id)
        if linked_elsewhere is not None:
            return
        uow.discord_account_link_repo.save(
            DiscordAccountLink(
                link_id=None,
                user_id=user_id,
                account=DiscordAccount(
                    discord_user_id=account.provider_user_id,
                    username=account.username,
                    global_name=account.display_name,
                    avatar_url=account.avatar_url,
                ),
                visibility=DiscordVisibility.TEAMMATES,
                linked_at=datetime.now(),
            )
        )

    @staticmethod
    def _build_unique_username(uow: IUnitOfWork, base_username: str) -> str:
        candidate = (base_username or "jugador").strip() or "jugador"
        if not CatalogValidationService.is_duplicated_username(candidate, uow=uow):
            return candidate
        counter = 1
        while CatalogValidationService.is_duplicated_username(f"{candidate}_{counter}", uow=uow):
            counter += 1
        return f"{candidate}_{counter}"
