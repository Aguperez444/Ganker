from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm


from app.application.useCases.user_login import UserLogin
from app.application.useCases.refresh_token import RefreshToken
from app.application.useCases.user_logout import UserLogout

from app.infrastructure.api.auth.jwt_token_service import JwtTokenService
from app.infrastructure.api.auth.password_hash_service import PasswordHashService
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory
from app.infrastructure.config.settings import settings

from app.infrastructure.api.dto.auth_tokens_response import AuthTokensResponse
from app.infrastructure.api.dto.refresh_token_request import RefreshTokenRequest
from app.infrastructure.api.dto.login_request import LoginRequest

router = APIRouter(prefix="/auth/v1")

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), force_role: str|None = None) -> AuthTokensResponse:
    uow = uow_factory()
    token_service = JwtTokenService(settings.jwt_secret_key)
    password_hasher = PasswordHashService()

    login_data = LoginRequest(mail=form_data.username, password=form_data.password)

    role = None

    if force_role:
        role = force_role
    # TODO CAMBIAR TODO ESTO QUE ESTÁ HARDCODEADO
    user_login_use_case = UserLogin(uow, token_service, password_hasher)

    # TODO CAMBIAR EN ESTE USECASE TAMBIÉN
    access_tokens = user_login_use_case.execute(login_data, role)



    return access_tokens

@router.post("/refresh", response_model=AuthTokensResponse, status_code=status.HTTP_200_OK)
def refresh(refresh_data: RefreshTokenRequest) -> AuthTokensResponse:
    uow = uow_factory()
    token_service = JwtTokenService(settings.jwt_secret_key)

    refresh_token_use_case = RefreshToken(uow, token_service)

    #TODO CAMBIAR ESTO HARCODEADO ACA TAMBIÉN
    role = None
    if refresh_data.force_token:
        role = refresh_data.force_token

    return refresh_token_use_case.execute(refresh_data.refresh_token, role)

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(refresh_data: RefreshTokenRequest):
    uow = uow_factory()
    token_service = JwtTokenService(settings.jwt_secret_key)

    logout_use_case = UserLogout(uow, token_service)
    logout_use_case.execute(refresh_data.refresh_token)
    return None
