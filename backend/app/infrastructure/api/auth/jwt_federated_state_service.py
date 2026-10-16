import secrets
from datetime import datetime, timedelta, timezone

import jwt

from app.application.ports.i_federated_state_service import IFederatedStateService
from app.domain.exceptions.federated_auth.invalid_federated_registration_token_exception import (
    InvalidFederatedRegistrationTokenException,
)
from app.domain.exceptions.federated_auth.invalid_federated_state_exception import InvalidFederatedStateException
from app.domain.models.federated_identity import FederatedAccount, FederatedProvider

FEDERATED_STATE_PURPOSE = "federated_auth_state"
FEDERATED_REGISTRATION_PURPOSE = "federated_auth_register"


class JwtFederatedStateService(IFederatedStateService):
    """
    Tokens JWT firmados sin estado para:
    1) Proteger contra CSRF en el inicio de sesión federado (state).
    2) Mantener la cuenta verificada del proveedor mientras el jugador elige su username y nombre.
    """

    def __init__(self, secret_key: str, state_expiration_minutes: int = 10, registration_expiration_minutes: int = 15):
        self.secret_key: str = secret_key
        self.state_expiration_minutes: int = state_expiration_minutes
        self.registration_expiration_minutes: int = registration_expiration_minutes

    def create_state(self, provider: FederatedProvider) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "purpose": FEDERATED_STATE_PURPOSE,
            "provider": provider.value,
            "nonce": secrets.token_urlsafe(8),
            "iat": now,
            "exp": now + timedelta(minutes=self.state_expiration_minutes),
        }
        return jwt.encode(payload, self.secret_key, algorithm="HS256")

    def validate_state(self, state: str, expected_provider: FederatedProvider) -> None:
        try:
            payload = jwt.decode(state, self.secret_key, algorithms=["HS256"])
        except jwt.PyJWTError:
            raise InvalidFederatedStateException()

        if payload.get("purpose") != FEDERATED_STATE_PURPOSE or payload.get("provider") != expected_provider.value:
            raise InvalidFederatedStateException()

    def create_registration_token(self, account: FederatedAccount) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "purpose": FEDERATED_REGISTRATION_PURPOSE,
            "provider": account.provider.value,
            "provider_user_id": account.provider_user_id,
            "username": account.username,
            "display_name": account.display_name,
            "email": account.email,
            "avatar_url": account.avatar_url,
            "iat": now,
            "exp": now + timedelta(minutes=self.registration_expiration_minutes),
        }
        return jwt.encode(payload, self.secret_key, algorithm="HS256")

    def decode_registration_token(self, token: str) -> FederatedAccount:
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=["HS256"])
        except jwt.PyJWTError:
            raise InvalidFederatedRegistrationTokenException()

        if payload.get("purpose") != FEDERATED_REGISTRATION_PURPOSE:
            raise InvalidFederatedRegistrationTokenException()

        try:
            return FederatedAccount(
                provider=FederatedProvider(payload["provider"]),
                provider_user_id=str(payload["provider_user_id"]),
                username=str(payload["username"]),
                display_name=payload.get("display_name"),
                email=payload.get("email"),
                avatar_url=payload.get("avatar_url"),
            )
        except (KeyError, ValueError, TypeError):
            raise InvalidFederatedRegistrationTokenException()
