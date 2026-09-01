from datetime import datetime, timedelta, timezone
from typing import Tuple

import jwt

from app.application.ports.i_token_service import ITokenService
from app.domain.exceptions.Invalid_token_exception import InvalidTokenException


class JwtTokenService(ITokenService):

    def __init__(self, secret_key: str, access_expiration_minutes: int = 30, refresh_expiration_days: int = 7):
        self.secret_key = secret_key
        self.expiration_minutes = access_expiration_minutes
        self.refresh_expiration_days = refresh_expiration_days

    def generate_tokens(self, user_id: int) -> Tuple[str, str]:
        now = datetime.now(timezone.utc)
        expiration = now + timedelta(minutes=self.expiration_minutes)

        access_payload = {
            "sub": str(user_id),
            "type": "access",
            "iat": now,
            "exp": expiration,
        }

        refresh_payload = {
            "sub": str(user_id),
            "type": "refresh",
            "iat": now,
            "exp": now + timedelta(days=self.refresh_expiration_days),
        }

        access_token =  jwt.encode(
            access_payload,
            self.secret_key,
            algorithm="HS256",
        )

        refresh_token = jwt.encode(
            refresh_payload,
            self.secret_key,
            algorithm="HS256",
        )

        return access_token, refresh_token

    def verify_access_token(self, access_token: str) -> int:
        try:
            payload = jwt.decode(access_token, self.secret_key, algorithms=["HS256"])
        except jwt.PyJWTError as e:
            raise InvalidTokenException(f"Token inválido: {str(e)}")

        if payload.get("type") != "access":
            raise InvalidTokenException("Token inválido: no es un access token")
        return int(payload["sub"])

    def verify_refresh_token(self, refresh_token: str) -> int:
        try:
            payload = jwt.decode(refresh_token, self.secret_key, algorithms=["HS256"])
        except jwt.PyJWTError as e:
            raise InvalidTokenException(f"Token inválido: {str(e)}")

        if payload.get("type") != "refresh":
            raise InvalidTokenException("Token inválido: no es un refresh token")
        return int(payload["sub"])