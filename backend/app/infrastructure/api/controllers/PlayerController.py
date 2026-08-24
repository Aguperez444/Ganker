from fastapi import APIRouter, HTTPException, Query

from app.infrastructure.config.settings import settings

from app.infrastructure.api.dto.register_player_request import RegisterPlayerRequest

router = APIRouter()

@router.post("/api/v1/players")
def register_player(request: RegisterPlayerRequest):
    from app.application.useCases.register_player import RegisterPlayer
    from app.infrastructure.api.jwt.jwt_token_service import JwtTokenService
    from app.infrastructure.database.repositories.player_repository_impl import PlayerRepositoryImpl

    player_repository = PlayerRepositoryImpl()
    token_service = JwtTokenService(settings.jwt_secret_key)
    register_player_use_case = RegisterPlayer(player_repository, token_service)

    token = register_player_use_case.execute(request)
    return {"token": token}
