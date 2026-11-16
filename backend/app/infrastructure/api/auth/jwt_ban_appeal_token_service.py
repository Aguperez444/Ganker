from datetime import datetime, timedelta, timezone

import jwt

from app.domain.exceptions.auth.invalid_token_exception import InvalidTokenException


class JwtBanAppealTokenService:
    def __init__(self, secret_key: str):
        self.secret_key = secret_key

    def generate_token(self, user_id: int, ban_id: int) -> str:
        now = datetime.now(timezone.utc)
        return jwt.encode({
            "sub": str(user_id), "ban_id": ban_id, "type": "ban_appeal",
            "aud": "ban-appeal", "iat": now, "exp": now + timedelta(hours=1),
        }, self.secret_key, algorithm="HS256")

    def verify_token(self, token: str) -> dict:
        try:
            payload = jwt.decode(
                token, self.secret_key, algorithms=["HS256"], audience="ban-appeal",
                options={"require": ["sub", "ban_id", "type", "exp", "iat", "aud"]},
            )
            if payload["type"] != "ban_appeal" or type(payload["ban_id"]) is not int or payload["ban_id"] <= 0:
                raise ValueError("Permiso de apelación inválido")
            user_id = int(payload["sub"])
            if user_id <= 0:
                raise ValueError("Usuario inválido")
            return {"user_id": user_id, "ban_id": payload["ban_id"]}
        except (jwt.PyJWTError, ValueError, TypeError, KeyError) as exc:
            raise InvalidTokenException("El permiso para apelar venció o es inválido. Volvé a iniciar sesión.") from exc
