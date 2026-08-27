from fastapi import APIRouter, HTTPException, Query

from app.infrastructure.config.settings import settings

from app.infrastructure.api.dto.register_player_request import RegisterPlayerRequest
from app.application.useCases.register_player import RegisterPlayer
from app.infrastructure.api.jwt.jwt_token_service import JwtTokenService
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory


router = APIRouter()

@router.post("/api/v1/players", status_code=201)
def register_player(request: RegisterPlayerRequest):
    uow = uow_factory()

    token_service = JwtTokenService(settings.jwt_secret_key)
    register_player_use_case = RegisterPlayer(uow, token_service)

    token = register_player_use_case.execute(request)
    return {"token": token}
