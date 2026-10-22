import logging
from typing import List
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from app.domain.exceptions.domain_exception import DomainException
from app.domain.exceptions.auth.insufficient_permissions_exception import InsufficientPermissionsException
from app.domain.exceptions.user.account_status_unavailable_exception import AccountStatusUnavailableException
from app.infrastructure.api.auth.jwt_token_service import JwtTokenService
from app.infrastructure.config.settings import settings
from app.domain.models.user_role import UserRole
import app.infrastructure.database.unit_of_work.uow_factory as uow_factory_module

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/v1/login")
token_service = JwtTokenService(settings.jwt_secret_key)

def get_current_user_data(token: str = Depends(oauth2_scheme)) -> dict:
    # Válida el token y devuelve el payload decodificado
    token_data = token_service.verify_access_token(token)
    user_id = token_data.get("user_id") if isinstance(token_data, dict) else None
    if isinstance(user_id, int):
        try:
            with uow_factory_module.uow_factory() as uow:
                user = uow.user_repo.get_user_by_id(user_id)
                if user is not None and getattr(user, "banned", False) is True:
                    uow.moderation_repo.unban_user_if_applicable(user_id)
        except DomainException:
            raise
        except Exception as exc:
            logger.exception("No se pudo verificar el baneo del usuario %s", user_id)
            raise AccountStatusUnavailableException() from exc
    return token_data

def get_current_user_id(token_data: dict = Depends(get_current_user_data)) -> int:
    # Extrae el user_id del payload del token
    return token_data["user_id"]

class RequireRole:
    # Para endpoints que requieran roles específicos
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, token_data: dict = Depends(get_current_user_data)) -> dict:
        role: UserRole = token_data["role"]
        if role not in self.allowed_roles:
            raise InsufficientPermissionsException()
        return token_data

# Atajos para inyectar en tus rutas
require_owner = RequireRole([UserRole.OWNER])
require_admin = RequireRole([UserRole.ADMIN, UserRole.OWNER])
require_player = RequireRole([UserRole.PLAYER, UserRole.ADMIN, UserRole.OWNER])
