from fastapi import APIRouter, Depends, status, Request, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm

from app.application.use_cases.forgot_password import ForgotPassword
from app.application.use_cases.reset_password import ResetPassword
from app.application.use_cases.user_login import UserLogin
from app.application.use_cases.refresh_token import RefreshToken
from app.application.use_cases.user_logout import UserLogout
from app.domain.services.smtp_email_service import SMTPEmailService

from app.infrastructure.api.auth.jwt_token_service import JwtTokenService
from app.infrastructure.api.auth.password_hash_service import PasswordHashService
from app.infrastructure.api.dependencies.login_rate_limiter import login_rate_limiter
from app.infrastructure.api.dto.request.forgot_password_request import ForgotPasswordRequest
from app.infrastructure.api.dto.request.reset_password_request import ResetPasswordRequest
from app.infrastructure.api.dto.response.reset_password_message_response import ResetPasswordMessageResponse
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory
from app.infrastructure.config.settings import settings

from app.infrastructure.api.dto.response.auth_tokens_response import AuthTokensResponse
from app.infrastructure.api.dto.request.refresh_token_request import RefreshTokenRequest
from app.infrastructure.api.dto.request.login_request import LoginRequest

router = APIRouter(prefix="/auth/v1", tags=["Authentication"])

@router.post("/login", response_model=AuthTokensResponse)
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()) -> AuthTokensResponse:
    login_rate_limiter.check(request, identifier=form_data.username)

    uow = uow_factory()
    token_service = JwtTokenService(settings.jwt_secret_key)
    password_hasher = PasswordHashService()

    login_data = LoginRequest(mail=form_data.username, password=form_data.password)

    user_login_use_case = UserLogin(uow, token_service, password_hasher)

    access_tokens = user_login_use_case.execute(login_data)



    return access_tokens

@router.post("/refresh", response_model=AuthTokensResponse, status_code=status.HTTP_200_OK)
def refresh(refresh_data: RefreshTokenRequest) -> AuthTokensResponse:
    uow = uow_factory()
    token_service = JwtTokenService(settings.jwt_secret_key)

    refresh_token_use_case = RefreshToken(uow, token_service)

    return refresh_token_use_case.execute(refresh_data.refresh_token)

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(refresh_data: RefreshTokenRequest):
    uow = uow_factory()
    token_service = JwtTokenService(settings.jwt_secret_key)

    logout_use_case = UserLogout(uow, token_service)
    logout_use_case.execute(refresh_data.refresh_token)
    return None


@router.post("/forgot-password", response_model=ResetPasswordMessageResponse, status_code=status.HTTP_200_OK, summary="Solicitar enlace para restaurar la contraseña")
async def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks):

    uow = uow_factory()
    email_service = SMTPEmailService()

    use_case = ForgotPassword(uow)
    raw_token = use_case.execute(request.email)

    if raw_token:
        background_tasks.add_task(
            email_service.send_password_reset_email,
            to_email=request.email,
            raw_token=raw_token
        )

    return ResetPasswordMessageResponse(
        message="Si el correo coincide con una cuenta activa, recibirás un enlace de recuperación"
    )

@router.post("/reset-password", response_model=ResetPasswordMessageResponse, status_code=status.HTTP_200_OK)
def reset_password(request: ResetPasswordRequest):
    uow = uow_factory()
    hash_service = PasswordHashService()
    use_case = ResetPassword(hash_service, uow)

    use_case.execute(request.token, request.new_password)

    return ResetPasswordMessageResponse(
        message="La contraseña ha sido restablecida correctamente"
    )