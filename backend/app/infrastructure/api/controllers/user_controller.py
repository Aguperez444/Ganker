from typing import cast, Optional

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Form

from app.application.useCases.query_users import QueryUsers
from app.application.useCases.register_user import RegisterUser
from app.application.useCases.update_player import UpdateUser
from app.infrastructure.api.dependencies.auth import get_current_user_id, require_player, require_admin
from app.infrastructure.api.dto.response.auth_tokens_response import AuthTokensResponse
from app.infrastructure.api.dto.response.get_player_response import GetUserResponse
from app.infrastructure.api.dto.request.register_user_request import RegisterUserRequest
from app.infrastructure.api.dto.response.register_user_response import RegisterUserResponse
from app.infrastructure.api.dto.response.update_user_response import UpdateUserResponse
from app.infrastructure.config.settings import settings

from app.infrastructure.api.dto.request.register_player_request import RegisterPlayerRequest
from app.infrastructure.api.auth.jwt_token_service import JwtTokenService
from app.infrastructure.api.auth.password_hash_service import PasswordHashService
from app.application.useCases.register_player import RegisterPlayer
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory
from app.infrastructure.storage.local_disk_storage_service import LocalDiskStorageService

router = APIRouter(prefix="/api/v1/users", tags=["Users"])

def get_storage_service():
    return LocalDiskStorageService()

@router.post("/register", response_model=AuthTokensResponse, status_code=201)
def register_player(request: RegisterPlayerRequest) -> AuthTokensResponse:
    uow = uow_factory()

    password_hasher_service = PasswordHashService()
    token_service = JwtTokenService(settings.jwt_secret_key)
    register_player_use_case = RegisterPlayer(uow, token_service, password_hasher_service)

    tokens = register_player_use_case.execute(request)
    return tokens

@router.post("/register_user", response_model=RegisterUserResponse, status_code=201, dependencies=[Depends(require_admin)])
def register_user(request: RegisterUserRequest, _user_id: int = Depends(get_current_user_id)) -> RegisterUserResponse:
    uow = uow_factory()

    password_hasher_service = PasswordHashService()
    token_service = JwtTokenService(settings.jwt_secret_key)
    register_user_use_case = RegisterUser(uow, token_service, password_hasher_service)

    tokens = register_user_use_case.execute(request, _user_id)
    return RegisterUserResponse(
        user_id=tokens.user_id,
        username=tokens.username,
        name=tokens.name,
        mail=tokens.mail,
        role=tokens.role
    )


@router.put("/", response_model=UpdateUserResponse, status_code=200, dependencies=[Depends(require_player)])
async def update_user(username: str = Form(...),name: str = Form(...),mail: str = Form(...),
                      icon: Optional[UploadFile] = File(None, description="Icon image file"),
                      user_id: int = Depends(get_current_user_id)
                      ) -> UpdateUserResponse:
    # Asegurarse de que la petición incluya un archivo con nombre
    if icon and not icon.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe tener un nombre válido."
        )

    uow = uow_factory()
    storage_service = get_storage_service()

    update_user_use_case = UpdateUser(uow, storage_service)
    updated_user = await update_user_use_case.execute(user_id, username, name, mail, icon)
    return UpdateUserResponse(
        user_id=cast(int, updated_user.user_id),
        username=updated_user.username,
        name=updated_user.name,
        mail=updated_user.mail,
        icon_url=updated_user.icon_url
    )
@router.get("/me", response_model=GetUserResponse, status_code=200, dependencies=[Depends(require_player)])
def get_user(user_id: int = Depends(get_current_user_id)) -> GetUserResponse:
    uow = uow_factory()
    get_user_use_case = QueryUsers(uow)
    user_dto = get_user_use_case.get_by_id(user_id)
    return user_dto

