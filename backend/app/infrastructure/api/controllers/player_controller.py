from fastapi import APIRouter

from app.infrastructure.api.dto.auth_tokens_response import AuthTokensResponse
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
