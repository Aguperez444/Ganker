from fastapi import Query, status, Depends
from fastapi.exceptions import WebSocketException
from app.infrastructure.config.settings import settings
from app.infrastructure.api.auth.jwt_token_service import JwtTokenService
from app.domain.models.user_role import UserRole

token_service = JwtTokenService(settings.jwt_secret_key)

def get_current_user_data_ws(token: str | None = Query(default=None)) -> dict:
    if not token:
        # 1008 = Policy Violation (rechaza la conexión durante el handshake)
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="Token de autenticación no proporcionado"
        )
    try:
        return token_service.verify_access_token(token)
    except Exception:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="Token inválido o expirado"
        )

def get_current_user_id_ws(token_data: dict = Depends(get_current_user_data_ws)) -> int:
    return token_data["user_id"]

class RequireRoleWS:
    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, token_data: dict = Depends(get_current_user_data_ws)) -> dict:
        role: UserRole = token_data["role"]
        if role not in self.allowed_roles:
            raise WebSocketException(
                code=status.WS_1008_POLICY_VIOLATION,
                reason="Permisos insuficientes"
            )
        return token_data


require_owner = RequireRoleWS([UserRole.OWNER])
require_admin = RequireRoleWS([UserRole.ADMIN, UserRole.OWNER])
require_player = RequireRoleWS([UserRole.PLAYER, UserRole.ADMIN, UserRole.OWNER])
