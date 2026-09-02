import uuid
from datetime import datetime, timedelta, timezone
from typing import Tuple, Dict

import jwt
from typing_extensions import Any

from app.application.ports.i_token_service import ITokenService
from app.domain.exceptions.Invalid_token_exception import InvalidTokenException


class JwtTokenService(ITokenService):

    def __init__(self, secret_key: str, access_expiration_minutes: int = 15, refresh_expiration_days: int = 7):
        self.secret_key = secret_key
        self.expiration_minutes = access_expiration_minutes
        self.refresh_expiration_days = refresh_expiration_days

    def generate_tokens(self, user_id: int, role: str) -> Tuple[str, str, str, datetime]:

        now = datetime.now(timezone.utc)
        access_expiration = now + timedelta(minutes=self.expiration_minutes)
        refresh_expiration = now + timedelta(minutes=self.refresh_expiration_days)
        refresh_jti = str(uuid.uuid4())

        access_payload = {
            "sub": str(user_id),
            "role": role,
            "type": "access",
            "iat": now,
            "exp": access_expiration,
        }

        refresh_payload = {
            "sub": str(user_id),
            "role": role,
            "jti": refresh_jti,
            "type": "refresh",
            "iat": now,
            "exp": refresh_expiration,
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

        return access_token, refresh_token, refresh_jti, refresh_expiration

    def verify_access_token(self, access_token: str) -> Dict[str, Any]:
        try:
            payload = jwt.decode(access_token, self.secret_key, algorithms=["HS256"])
        except jwt.PyJWTError as e:
            raise InvalidTokenException(f"Token inválido: {str(e)}")

        if payload.get("type") != "access":
            raise InvalidTokenException("Token inválido: no es un access token")
        return {
            "user_id": int(payload["sub"]),
            "role": payload.get("role")
        }

    def verify_refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        try:
            payload = jwt.decode(refresh_token, self.secret_key, algorithms=["HS256"])
        except jwt.PyJWTError as e:
            raise InvalidTokenException(f"Token inválido: {str(e)}")

        if payload.get("type") != "refresh":
            raise InvalidTokenException("Token inválido: no es un refresh token")
        
        if "jti" not in payload:
            raise InvalidTokenException("Token inválido: falta jti")

        return {
            "user_id": int(payload["sub"]),
            "role": payload.get("role"),
            "jti": payload["jti"],
            "exp": payload["exp"]
        }