import logging

from fastapi import Query, status, Depends
from fastapi.exceptions import WebSocketException
from app.domain.exceptions.auth.authentication_token_not_provided_exception import (
    AuthenticationTokenNotProvidedException,
)
from app.domain.exceptions.domain_exception import DomainException
from app.infrastructure.config.settings import settings
from app.infrastructure.api.auth.jwt_token_service import JwtTokenService
from app.domain.models.user_role import UserRole
import app.infrastructure.database.unit_of_work.uow_factory as uow_factory_module

logger = logging.getLogger(__name__)

token_service = JwtTokenService(settings.jwt_secret_key)

def get_current_user_data_ws(token: str | None = Query(default=None)) -> dict:
    if not token:
        # 1008 = Policy Violation (rechaza la conexión durante el handshake)
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="Token de autenticación no proporcionado"
        )
    try:
        token_data = token_service.verify_access_token(token)
    except Exception:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="Token inválido o expirado"
        )
    user_id = token_data.get("user_id") if isinstance(token_data, dict) else None
    if isinstance(user_id, int):
        try:
            with uow_factory_module.uow_factory() as uow:
                user = uow.user_repo.get_user_by_id(user_id)
                if user is not None and getattr(user, "banned", False) is True:
                    uow.moderation_repo.unban_user_if_applicable(user_id)
        except DomainException as exc:
            raise WebSocketException(
                code=status.WS_1008_POLICY_VIOLATION,
                reason=exc.message
            )
        except Exception as exc:
            logger.exception("No se pudo verificar el baneo del usuario %s", user_id)
            raise WebSocketException(
                code=status.WS_1011_INTERNAL_ERROR,
                reason="No se pudo verificar el estado de la cuenta. Intente nuevamente más tarde.",
            ) from exc
    return token_data

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
