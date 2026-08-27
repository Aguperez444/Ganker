from typing import cast
from fastapi import APIRouter, Depends

from app.application.useCases.create_videogame_profile import CreateVideogameProfile
from app.infrastructure.api.dependencies.auth import get_current_player_id
from app.infrastructure.api.dto.create_videogame_profile_request import CreateGameProfileRequest
from app.infrastructure.api.dto.create_videogame_profile_response import CreateGameProfileResponse
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory

router = APIRouter(prefix="/api/v1/game_profiles")

@router.post("/", status_code=201, response_model = CreateGameProfileResponse)
def create_game_profile(request: CreateGameProfileRequest, player_id: int = Depends(get_current_player_id)):
    uow = uow_factory()
    create_game_profile_use_case = CreateVideogameProfile(uow)
    game_profile = create_game_profile_use_case.execute(player_id, request)
    profile_id = cast(int, game_profile.game_profile_id)
    response = CreateGameProfileResponse(profile_id=profile_id)
    return response