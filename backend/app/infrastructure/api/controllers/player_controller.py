from typing import cast

from fastapi import APIRouter, Depends

from app.application.useCases.update_player import UpdatePlayer
from app.infrastructure.api.dependencies.auth import get_current_player_id
from app.infrastructure.api.dto.auth_tokens_response import AuthTokensResponse
from app.infrastructure.api.dto.update_player_request import UpdatePlayerRequest
from app.infrastructure.api.dto.update_player_response import UpdatePlayerResponse
from app.infrastructure.config.settings import settings

from app.infrastructure.api.dto.register_player_request import RegisterPlayerRequest
from app.infrastructure.api.auth.jwt_token_service import JwtTokenService
from app.infrastructure.api.auth.password_hash_service import PasswordHashService
from app.application.useCases.register_player import RegisterPlayer
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory

router = APIRouter(prefix="/api/v1/players")

@router.post("/")
def register_player(request: RegisterPlayerRequest) -> AuthTokensResponse:
    uow = uow_factory()

    password_hasher_service = PasswordHashService()
    token_service = JwtTokenService(settings.jwt_secret_key)
    register_player_use_case = RegisterPlayer(uow, token_service, password_hasher_service)

    tokens = register_player_use_case.execute(request)
    return tokens

@router.put("/", response_model=UpdatePlayerResponse, status_code=200)
def update_player(request: UpdatePlayerRequest, _player_id: int = Depends(get_current_player_id)) -> UpdatePlayerResponse:
    uow = uow_factory()

    update_player_use_case = UpdatePlayer(uow)
    updated_player = update_player_use_case.execute(_player_id, request)
    return UpdatePlayerResponse(
        player_id= cast(int, updated_player.player_id),
        username=updated_player.username,
        name=updated_player.name,
        mail=updated_player.mail
    )