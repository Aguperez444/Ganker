from typing import List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.infrastructure.api.auth.jwt_token_service import JwtTokenService
from app.infrastructure.config.settings import settings
from app.domain.models.UserRole import UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/v1/login")
token_service = JwtTokenService(settings.jwt_secret_key)

def get_current_user_data(token: str = Depends(oauth2_scheme)) -> dict:
    # Valida el token y devuelve el payload decodificado
    return token_service.verify_access_token(token)

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
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos suficientes para realizar esta acción"
            )
        return token_data

# Atajos para inyectar en tus rutas
require_owner = RequireRole([UserRole.OWNER])
require_admin = RequireRole([UserRole.ADMIN, UserRole.OWNER])
require_player = RequireRole([UserRole.PLAYER, UserRole.ADMIN, UserRole.OWNER])
