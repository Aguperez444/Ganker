# app/infrastructure/api/dependencies/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.infrastructure.api.auth.jwt_token_service import JwtTokenService
from app.infrastructure.config.settings import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/v1/login")
token_service = JwtTokenService(settings.jwt_secret_key)

def get_current_player_id(token: str = Depends(oauth2_scheme)) -> int:
    return int(token_service.verify_access_token(token))
