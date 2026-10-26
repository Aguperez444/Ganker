from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Form, Query, BackgroundTasks, Request
from typing import Optional


from app.application.use_cases.query_users import QueryUsers
from app.application.use_cases.search_users import SearchUsers
from app.infrastructure.api.dto.response.user_summary_response import UserSummaryResponse
from app.application.use_cases.register_user import RegisterUser
from app.application.use_cases.update_user import UpdateUser
from app.application.use_cases.request_email_change import RequestEmailChange
from app.infrastructure.api.dto.request.email_change_request import RequestEmailChangeRequest
from app.infrastructure.api.dto.response.email_change_message_response import EmailChangeMessageResponse
from app.infrastructure.api.dependencies.auth_rate_limiter import email_change_rate_limiter
from app.infrastructure.api.dependencies.auth import get_current_user_id, require_player, require_admin
from app.infrastructure.api.dto.response.registration_message_response import RegistrationMessageResponse
from app.infrastructure.api.dependencies.auth_rate_limiter import registration_rate_limiter
from app.infrastructure.email.resend_email_service import ResendEmailService
from app.infrastructure.api.dto.response.get.get_user_response import GetUserResponse
from app.infrastructure.api.dto.response.get.get_public_user_response import GetPublicUserResponse
from app.infrastructure.api.dto.request.register_user_request import RegisterUserRequest
from app.infrastructure.api.dto.response.create_register.register_user_response import RegisterUserResponse
from app.infrastructure.api.dto.response.update.update_user_response import UpdateUserResponse
from app.infrastructure.config.settings import settings

from app.infrastructure.api.dto.request.register_player_request import RegisterPlayerRequest
from app.infrastructure.api.auth.password_hash_service import PasswordHashService
from app.application.use_cases.register_player import RegisterPlayer
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory
from app.infrastructure.storage.local_disk_storage_service import LocalDiskStorageService
from app.application.use_cases.get_discord_authorization_url import GetDiscordAuthorizationUrl
from app.application.use_cases.link_discord_account import LinkDiscordAccount
from app.application.use_cases.query_discord_account import QueryDiscordAccount
from app.application.use_cases.unlink_discord_account import UnlinkDiscordAccount
from app.application.use_cases.update_discord_visibility import UpdateDiscordVisibility
from app.infrastructure.api.auth.jwt_oauth_state_service import JwtOAuthStateService
from app.infrastructure.api.dto.request.link_discord_account_request import LinkDiscordAccountRequest
from app.infrastructure.api.dto.request.update_discord_visibility_request import UpdateDiscordVisibilityRequest
from app.infrastructure.api.dto.response.delete.delete_discord_account_link_response import DeleteDiscordAccountLinkResponse
from app.infrastructure.api.dto.response.get.get_discord_account_response import (
    DiscordAuthorizationUrlResponse, GetDiscordAccountResponse,
)
from app.infrastructure.discord_api.discord_oauth_provider import DiscordOAuthProvider, discord_http_client
from app.application.use_cases.delete_user import DeleteUserUseCase
from app.infrastructure.api.dto.response.delete.delete_user_response import DeleteUserResponse
router = APIRouter(prefix="/api/v1/users", tags=["Users"])

def get_storage_service():
    return LocalDiskStorageService()

def get_discord_oauth_provider():
    return DiscordOAuthProvider(discord_http_client)

def get_oauth_state_service():
    return JwtOAuthStateService(settings.jwt_secret_key)

@router.post("/register", response_model=RegistrationMessageResponse, status_code=202)
def register_player(request: RegisterPlayerRequest, background_tasks: BackgroundTasks, http_request: Request) -> RegistrationMessageResponse:
    registration_rate_limiter.check(http_request, identifier=request.mail)
    uow = uow_factory()

    password_hasher_service = PasswordHashService()
    register_player_use_case = RegisterPlayer(uow, password_hasher_service)
    raw_token = register_player_use_case.execute(request)
    # Enviar correo de confirmación de registro en segundo plano
    # permite que se muestre rápidamente la respuesta al usuario sin esperar a que se envíe el correo
    background_tasks.add_task(
        ResendEmailService().send_registration_confirmation_email,
        to_email=str(request.mail).strip().lower(), raw_token=raw_token, username=request.username.strip(),
    )
    return RegistrationMessageResponse(
        message="Te enviamos un correo para confirmar la creación de tu cuenta. El enlace vence en 24 horas.",
    )

@router.post("/register_user", response_model=RegisterUserResponse, status_code=201, dependencies=[Depends(require_admin)])
def register_user(request: RegisterUserRequest, user_id: int = Depends(get_current_user_id)) -> RegisterUserResponse:
    uow = uow_factory()

    password_hasher_service = PasswordHashService()
    register_user_use_case = RegisterUser(uow, password_hasher_service)

    tokens = register_user_use_case.execute(request, user_id)
    return RegisterUserResponse(
        user_id=tokens.user_id,
        username=tokens.username,
        name=tokens.name,
        mail=tokens.mail,
        role=tokens.role
    )


@router.put("/", response_model=UpdateUserResponse, status_code=200, dependencies=[Depends(require_player)])
def update_user(username: str = Form(...), name: str = Form(...),
                      icon: Optional[UploadFile] = File(None, description="Archivo de imagen del ícono"),
                      user_id: int = Depends(get_current_user_id)
                      ) -> UpdateUserResponse:
    # Asegurarse de que la petición incluya un archivo con nombre
    if icon and not icon.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe tener un nombre válido."
        )

    file_obj = icon.file if icon else None
    file_name = icon.filename if icon else None
    if file_obj and not file_name:
        raise HTTPException(status_code=400, detail="El archivo de ícono del usuario debe tener un nombre válido.")

    uow = uow_factory()
    storage_service = get_storage_service()

    update_user_use_case = UpdateUser(uow, storage_service)
    return update_user_use_case.execute(user_id, username, name, file_obj, file_name)

@router.post("/me/email-change", response_model=EmailChangeMessageResponse, status_code=202, dependencies=[Depends(require_player)])
def request_email_change(request: RequestEmailChangeRequest, background_tasks: BackgroundTasks,
                         http_request: Request, user_id: int = Depends(get_current_user_id)) -> EmailChangeMessageResponse:
    email_change_rate_limiter.check(http_request, identifier=str(user_id))
    use_case = RequestEmailChange(uow_factory(), PasswordHashService())
    raw_token = use_case.execute(user_id, request.mail, request.password)
    background_tasks.add_task(
        ResendEmailService().send_email_change_confirmation_email,
        to_email=request.mail.strip().lower(),
        raw_token=raw_token,
    )
    return EmailChangeMessageResponse(
        message="Te enviamos un enlace al nuevo email. El correo actual se mantendrá hasta que confirmes el cambio. El enlace vence en 24 horas.",
    )


@router.get("/me", response_model=GetUserResponse, status_code=200, dependencies=[Depends(require_player)])
def get_user(user_id: int = Depends(get_current_user_id)) -> GetUserResponse:
    uow = uow_factory()
    get_user_use_case = QueryUsers(uow)
    user_dto = get_user_use_case.get_by_id(user_id)
    return user_dto


@router.get("/search", response_model=list[UserSummaryResponse], status_code=200, dependencies=[Depends(require_player)])
def search_users(
    username: str = Query(..., min_length=1, pattern=r"\S", description="Coincidencia parcial del username, sin distinguir mayúsculas"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
) -> list[UserSummaryResponse]:
    uow = uow_factory()
    return SearchUsers(uow).execute(username, limit=size, offset=(page - 1) * size)


@router.get("/{user_id}/profile", response_model=GetPublicUserResponse, status_code=200, dependencies=[Depends(require_player)])
def get_public_user_profile(user_id: int) -> GetPublicUserResponse:
    # Perfil de otro jugador (desde buscar jugadores, el chat o un equipo), sin sus datos privados
    uow = uow_factory()
    query_users_use_case = QueryUsers(uow)
    return query_users_use_case.get_public_profile(user_id)

@router.delete("/me", response_model=DeleteUserResponse, status_code=200, dependencies=[Depends(require_player)])
def delete_my_user(user_id: int = Depends(get_current_user_id)) -> DeleteUserResponse:
    uow = uow_factory()
    return DeleteUserUseCase(uow).execute(target_user_id=user_id, requester_id=user_id)


@router.delete("/{user_id}", response_model=DeleteUserResponse, status_code=200)
def delete_user_by_id(user_id: int, token_data: dict = Depends(require_admin)) -> DeleteUserResponse:
    uow = uow_factory()
    return DeleteUserUseCase(uow).execute(
        target_user_id=user_id,
        requester_id=token_data["user_id"],
        requester_role=token_data["role"],
    )


# ---------------------------------------------------------
# Cuenta de Discord vinculada al perfil general
# ---------------------------------------------------------

@router.get("/me/discord/authorize", response_model=DiscordAuthorizationUrlResponse, status_code=200, dependencies=[Depends(require_player)])
def get_discord_authorization_url(user_id: int = Depends(get_current_user_id)):
    use_case = GetDiscordAuthorizationUrl(get_discord_oauth_provider(), get_oauth_state_service())
    return use_case.execute(user_id)

@router.post("/me/discord", response_model=GetDiscordAccountResponse, status_code=200, dependencies=[Depends(require_player)])
def link_discord_account(request: LinkDiscordAccountRequest, user_id: int = Depends(get_current_user_id)):
    uow = uow_factory()
    use_case = LinkDiscordAccount(get_discord_oauth_provider(), get_oauth_state_service(), uow)
    return use_case.execute(user_id, request.code, request.state, request.visibility)

@router.put("/me/discord/visibility", response_model=GetDiscordAccountResponse, status_code=200, dependencies=[Depends(require_player)])
def update_discord_visibility(request: UpdateDiscordVisibilityRequest, user_id: int = Depends(get_current_user_id)):
    uow = uow_factory()
    return UpdateDiscordVisibility(uow).execute(user_id, request.visibility)

@router.delete("/me/discord", response_model=DeleteDiscordAccountLinkResponse, status_code=200, dependencies=[Depends(require_player)])
def unlink_discord_account(user_id: int = Depends(get_current_user_id)):
    uow = uow_factory()
    return UnlinkDiscordAccount(uow).execute(user_id)

@router.get("/me/discord", response_model=GetDiscordAccountResponse, status_code=200, dependencies=[Depends(require_player)])
def get_my_discord_account(user_id: int = Depends(get_current_user_id)):
    # Declarado antes que /{owner_id}/discord para que "me" no se tome como un id
    uow = uow_factory()
    return QueryDiscordAccount(uow).execute(user_id, user_id)

@router.get("/{owner_id}/discord", response_model=GetDiscordAccountResponse, status_code=200, dependencies=[Depends(require_player)])
def get_discord_account(owner_id: int, user_id: int = Depends(get_current_user_id)):
    # Solo devuelve la cuenta si quien consulta puede verla (visibilidad elegida por el dueño)
    uow = uow_factory()
    return QueryDiscordAccount(uow).execute(owner_id, user_id)
