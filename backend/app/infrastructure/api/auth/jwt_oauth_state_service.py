import secrets
from datetime import datetime, timedelta, timezone

import jwt

from app.application.ports.i_oauth_state_service import IOAuthStateService
from app.domain.exceptions.discord.invalid_oauth_state_exception import InvalidOAuthStateException

STATE_PURPOSE = "oauth_link"


class JwtOAuthStateService(IOAuthStateService):
    """State de OAuth firmado (JWT): dice para qué jugador es y vence a los pocos minutos. No hace falta guardarlo."""

    def __init__(self, secret_key: str, expiration_minutes: int = 10):
        self.secret_key: str = secret_key
        self.expiration_minutes: int = expiration_minutes

    def create_state(self, user_id: int) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "sub": str(user_id),
            "purpose": STATE_PURPOSE,
            "nonce": secrets.token_urlsafe(8),
            "iat": now,
            "exp": now + timedelta(minutes=self.expiration_minutes),
        }
        return jwt.encode(payload, self.secret_key, algorithm="HS256")

    def validate_state(self, state: str, user_id: int) -> None:
        try:
            payload = jwt.decode(state, self.secret_key, algorithms=["HS256"])
        except jwt.PyJWTError:
            raise InvalidOAuthStateException()

        if payload.get("purpose") != STATE_PURPOSE or payload.get("sub") != str(user_id):
            raise InvalidOAuthStateException()
