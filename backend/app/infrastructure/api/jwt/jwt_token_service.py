from datetime import datetime, timedelta, timezone

import jwt

from app.application.ports.i_token_service import ITokenService


class JwtTokenService(ITokenService):

    def __init__(self, secret_key: str, expiration_minutes: int = 30):
        self.secret_key = secret_key
        self.expiration_minutes = expiration_minutes

    def generate_access_token(self, user_id: int) -> str:
        now = datetime.now(timezone.utc)
        expiration = now + timedelta(
            minutes=self.expiration_minutes
        )

        payload = {
            "sub": user_id,
            "iat": now,
            "exp": expiration,
        }

        return jwt.encode(
            payload,
            self.secret_key,
            algorithm="HS256",
        )

    def verify_access_token(self, token: str) -> int:
        payload = jwt.decode(
            token,
            self.secret_key,
            algorithms=["HS256"],
        )

        return payload["sub"]