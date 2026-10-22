from datetime import datetime
from unittest.mock import MagicMock

import pytest

from app.application.use_cases.authenticate_federated_user import AuthenticateFederatedUser
from app.application.use_cases.complete_federated_registration import CompleteFederatedRegistration
from app.application.use_cases.delete_user import DeleteUserUseCase
from app.domain.exceptions.federated_auth.federated_account_already_linked_exception import (
    FederatedAccountAlreadyLinkedException,
)
from app.domain.models.federated_identity import FederatedAccount, FederatedIdentity, FederatedProvider
from app.domain.models.user import User
from app.domain.models.user_role import UserRole
from app.infrastructure.api.dto.request.federated_auth_request import (
    CompleteFederatedRegistrationRequest,
    FederatedCallbackRequest,
)


class TestFederatedAuthAndSoftDeleteUseCases:

    @pytest.mark.parametrize(
        "provider,email",
        [
            (FederatedProvider.GOOGLE, "user@google.test"),
            (FederatedProvider.DISCORD, "user@discord.test"),
            (FederatedProvider.STEAM, None),
            (FederatedProvider.TWITCH, "user@twitch.test"),
        ],
    )
    def test_authenticate_federated_user_requests_registration_when_previous_owner_was_soft_deleted(
        self, provider: FederatedProvider, email: str | None
    ):
        account = FederatedAccount(
            provider=provider,
            provider_user_id=f"{provider.value}-123",
            username=f"player_{provider.value}",
            display_name=f"Player {provider.label}",
            email=email,
            avatar_url="https://example.com/avatar.png",
        )

        provider_adapter = MagicMock()
        provider_adapter.provider = provider
        provider_adapter.exchange_callback.return_value = account

        provider_resolver = MagicMock()
        provider_resolver.resolve.return_value = provider_adapter

        state_service = MagicMock()
        state_service.create_registration_token.return_value = "reg-token-123"

        token_service = MagicMock()

        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        # Los repositorios filtran usuarios con deleted=True y devuelven None
        uow.federated_identity_repo.get_by_provider_and_external_id.return_value = None
        uow.discord_account_link_repo.get_by_discord_user_id.return_value = None
        uow.user_repo.get_user_by_mail.return_value = None
        uow.user_repo.get_user_by_username.return_value = None

        use_case = AuthenticateFederatedUser(provider_resolver, state_service, token_service, uow)
        response = use_case.execute(
            provider.value,
            FederatedCallbackRequest(code="ok", state="valid-state"),
        )

        assert response.status == "needs_registration"
        assert response.provider == provider.value
        assert response.registration_token == "reg-token-123"
        assert response.suggested_username == f"player_{provider.value}"
        assert response.email == email

    @pytest.mark.parametrize(
        "provider,email",
        [
            (FederatedProvider.GOOGLE, "user@google.test"),
            (FederatedProvider.DISCORD, "user@discord.test"),
            (FederatedProvider.STEAM, None),
            (FederatedProvider.TWITCH, "user@twitch.test"),
        ],
    )
    def test_complete_federated_registration_succeeds_after_soft_delete_for_all_providers(
        self, provider: FederatedProvider, email: str | None
    ):
        account = FederatedAccount(
            provider=provider,
            provider_user_id=f"{provider.value}-123",
            username=f"player_{provider.value}",
            display_name=f"Player {provider.label}",
            email=email,
            avatar_url="https://example.com/avatar.png",
        )

        state_service = MagicMock()
        state_service.decode_registration_token.return_value = account

        token_service = MagicMock()
        token_service.generate_tokens.return_value = ("acc-tok", "ref-tok", "jti-1", datetime.now())

        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.federated_identity_repo.get_by_provider_and_external_id.return_value = None
        uow.discord_account_link_repo.get_by_discord_user_id.return_value = None
        uow.user_repo.get_user_by_username.return_value = None
        uow.user_repo.get_user_by_mail.return_value = None
        uow.user_repo.create_user.side_effect = lambda u: User(
            user_id=42,
            username=u.username,
            name=u.name,
            mail=u.mail,
            password_hash=None,
            role=UserRole.PLAYER,
            profiles=[],
            icon_url=u.icon_url,
            last_connection=u.last_connection,
        )

        use_case = CompleteFederatedRegistration(state_service, token_service, uow)
        result = use_case.execute(
            CompleteFederatedRegistrationRequest(
                registration_token="reg-token-123",
                username=f"player_{provider.value}",
                name=f"Player {provider.label}",
            )
        )

        assert result.access_token == "acc-tok"
        assert result.refresh_token == "ref-tok"
        uow.user_repo.create_user.assert_called_once()
        uow.federated_identity_repo.save.assert_called_once()
        if provider == FederatedProvider.DISCORD:
            uow.discord_account_link_repo.save.assert_called_once()

    def test_delete_user_use_case_removes_federated_identities_and_discord_link(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.user_repo.get_user_by_id.return_value = User(
            user_id=10,
            username="player10",
            name="Player Ten",
            mail="p10@example.com",
            password_hash=None,
            role=UserRole.PLAYER,
            profiles=[],
        )
        uow.game_profile_repo.soft_delete_by_player_id.return_value = []

        response = DeleteUserUseCase(uow).execute(target_user_id=10, requester_id=10)

        assert "eliminado" in response.message.lower()
        uow.discord_account_link_repo.delete_by_user_id.assert_called_once_with(10)
        uow.federated_identity_repo.delete_by_user_id.assert_called_once_with(10)
        uow.user_repo.soft_delete_user.assert_called_once_with(10)
