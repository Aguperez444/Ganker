from typing import cast
from fastapi import APIRouter, Depends

from app.application.use_cases.create_videogame_profile import CreateVideogameProfile
from app.application.use_cases.update_videogame_profile import UpdateVideogameProfile
from app.infrastructure.api.dependencies.auth import get_current_user_id, require_player
from app.infrastructure.api.dto.request.create_videogame_profile_request import CreateGameProfileRequest
from app.infrastructure.api.dto.response.create_videogame_profile_response import CreateGameProfileResponse
from app.infrastructure.api.dto.request.update_videogame_profile_request import UpdateGameProfileRequest
from app.infrastructure.api.dto.response.update_videogame_profile_response import UpdateGameProfileResponse
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory

router = APIRouter(prefix="/api/v1/game_profiles", tags=["Game Profiles"])

@router.post("/", status_code=201, response_model = CreateGameProfileResponse, dependencies=[Depends(require_player)])
def create_game_profile(request: CreateGameProfileRequest, player_id: int = Depends(get_current_user_id)):
    uow = uow_factory()
    create_game_profile_use_case = CreateVideogameProfile(uow)
    game_profile = create_game_profile_use_case.execute(player_id, request)
    profile_id = cast(int, game_profile.game_profile_id)
    response = CreateGameProfileResponse(profile_id=profile_id)
    return response

@router.put("/{game_profile_id}", response_model=UpdateGameProfileResponse, status_code=200, dependencies=[Depends(require_player)])
def update_game_profile(game_profile_id: int, request: UpdateGameProfileRequest, player_id: int = Depends(get_current_user_id)):
    uow = uow_factory()
    update_game_profile_use_case = UpdateVideogameProfile(uow)
    updated_game_profile = update_game_profile_use_case.execute(player_id, game_profile_id, request)

    response = updated_game_profile
    return response