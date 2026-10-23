from fastapi import APIRouter, Depends, status, Request, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm

from app.application.use_cases.authenticate_federated_user import AuthenticateFederatedUser
from app.application.use_cases.complete_federated_registration import CompleteFederatedRegistration
from app.application.use_cases.forgot_password import ForgotPassword
from app.application.use_cases.get_federated_authorization_url import GetFederatedAuthorizationUrl
from app.application.use_cases.reset_password import ResetPassword
from app.application.use_cases.confirm_registration import ConfirmRegistration
from app.application.use_cases.confirm_email_change import ConfirmEmailChange
from app.infrastructure.api.dto.request.email_change_request import ConfirmEmailChangeRequest
from app.infrastructure.api.dto.response.email_change_message_response import EmailChangeMessageResponse
from app.application.use_cases.resend_registration import ResendRegistration
from app.infrastructure.api.dto.request.confirm_registration_request import ConfirmRegistrationRequest, ResendRegistrationRequest
from app.infrastructure.api.dto.response.registration_message_response import RegistrationMessageResponse
from app.application.use_cases.user_login import UserLogin
from app.application.use_cases.refresh_token import RefreshToken
from app.application.use_cases.user_logout import UserLogout
from app.infrastructure.email.resend_email_service import ResendEmailService

from app.infrastructure.api.auth.jwt_federated_state_service import JwtFederatedStateService
from app.infrastructure.api.auth.jwt_token_service import JwtTokenService
from app.infrastructure.api.auth.password_hash_service import PasswordHashService
from app.infrastructure.api.dependencies.auth_rate_limiter import login_rate_limiter, forgot_password_rate_limiter, registration_rate_limiter
from app.infrastructure.api.dto.request.federated_auth_request import (
    CompleteFederatedRegistrationRequest,
    FederatedCallbackRequest,
)
from app.infrastructure.api.dto.request.forgot_password_request import ForgotPasswordRequest
from app.infrastructure.api.dto.request.reset_password_request import ResetPasswordRequest
from app.infrastructure.api.dto.response.federated_auth_response import (
    FederatedAuthorizationUrlResponse,
    FederatedCallbackResponse,
)
from app.infrastructure.api.dto.response.reset_password_message_response import ResetPasswordMessageResponse
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory
from app.infrastructure.config.settings import settings
from app.infrastructure.federated_auth.federated_auth_provider_resolver_impl import FederatedAuthProviderResolverImpl

from app.infrastructure.api.dto.response.auth_tokens_response import AuthTokensResponse
from app.infrastructure.api.dto.request.refresh_token_request import RefreshTokenRequest
from app.infrastructure.api.dto.request.login_request import LoginRequest

router = APIRouter(prefix="/auth/v1", tags=["Authentication"])


def get_federated_provider_resolver():
    return FederatedAuthProviderResolverImpl()


def get_federated_state_service():
    return JwtFederatedStateService(settings.jwt_secret_key)


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
async def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks, http_request: Request):
    forgot_password_rate_limiter.check(http_request, identifier=request.email)

    uow = uow_factory()
    email_service = ResendEmailService()

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


@router.post("/confirm-email-change", response_model=EmailChangeMessageResponse)
def confirm_email_change(request: ConfirmEmailChangeRequest) -> EmailChangeMessageResponse:
    use_case = ConfirmEmailChange(uow_factory())
    use_case.execute(request.token)
    return EmailChangeMessageResponse(message="Tu email se actualizó correctamente. Ya podés usar el nuevo correo para iniciar sesión.")


@router.post("/confirm-registration", response_model=RegistrationMessageResponse)
def confirm_registration(request: ConfirmRegistrationRequest) -> RegistrationMessageResponse:
    ConfirmRegistration(uow_factory()).execute(request.token)
    return RegistrationMessageResponse(message="Tu cuenta fue creada correctamente. Ya podés iniciar sesión.")


@router.post("/resend-registration", response_model=RegistrationMessageResponse)
def resend_registration(request: ResendRegistrationRequest, background_tasks: BackgroundTasks, http_request: Request) -> RegistrationMessageResponse:
    registration_rate_limiter.check(http_request, identifier=request.email)
    result = ResendRegistration(uow_factory()).execute(request.email)
    if result:
        raw_token, username = result
        # permite que se muestre el mensaje de éxito sin esperar a que se envíe el correo electrónico
        # el correo electrónico se enviará en segundo plano, y si hay un error, se registrará en los logs del servidor
        background_tasks.add_task(
            ResendEmailService().send_registration_confirmation_email,
            to_email=str(request.email).strip().lower(), raw_token=raw_token, username=username,
        )
    return RegistrationMessageResponse(
        message="Si hay un registro pendiente para ese correo, recibirás un nuevo enlace de confirmación.",
    )


# ---------------------------------------------------------
# Inicio de sesión y registro con identidades federadas (Discord, Steam, Twitch, Google)
# ---------------------------------------------------------

@router.get("/oauth/{provider}/authorize", response_model=FederatedAuthorizationUrlResponse, status_code=status.HTTP_200_OK)
def get_federated_authorization_url(provider: str) -> FederatedAuthorizationUrlResponse:
    use_case = GetFederatedAuthorizationUrl(get_federated_provider_resolver(), get_federated_state_service())
    return use_case.execute(provider)


@router.post("/oauth/{provider}/callback", response_model=FederatedCallbackResponse, status_code=status.HTTP_200_OK)
def authenticate_federated_user(provider: str, request: FederatedCallbackRequest) -> FederatedCallbackResponse:
    uow = uow_factory()
    token_service = JwtTokenService(settings.jwt_secret_key)
    use_case = AuthenticateFederatedUser(
        get_federated_provider_resolver(),
        get_federated_state_service(),
        token_service,
        uow,
    )
    return use_case.execute(provider, request)


@router.post("/oauth/complete-registration", response_model=AuthTokensResponse, status_code=status.HTTP_201_CREATED)
def complete_federated_registration(request: CompleteFederatedRegistrationRequest) -> AuthTokensResponse:
    uow = uow_factory()
    token_service = JwtTokenService(settings.jwt_secret_key)
    use_case = CompleteFederatedRegistration(get_federated_state_service(), token_service, uow)
    return use_case.execute(request)
