# app/infrastructure/api/dependencies/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.infrastructure.api.jwt.jwt_token_service import JwtTokenService
from app.infrastructure.config.settings import settings
#TODO Cambiar tokenUrl
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")
token_service = JwtTokenService(settings.jwt_secret_key)

def get_current_player_id(token: str = Depends(oauth2_scheme)) -> int:
    try:
        return int(token_service.verify_access_token(token))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )