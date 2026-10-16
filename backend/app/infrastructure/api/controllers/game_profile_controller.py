from datetime import timedelta

from fastapi import APIRouter, Depends

from app.application.use_cases.create_videogame_profile import CreateVideogameProfile
from app.application.use_cases.search_videogame_profile_player import SearchVideogameProfilePlayer
from app.application.use_cases.update_videogame_profile import UpdateVideogameProfile
from app.infrastructure.api.dependencies.auth import get_current_user_id, require_player
from app.infrastructure.api.dto.request.search_videogame_profiles_request import SearchVideogameProfilesRequest
from app.infrastructure.api.dto.request.create_videogame_profile_request import CreateGameProfileRequest
from app.infrastructure.api.dto.response.create_register.create_videogame_profile_response import CreateGameProfileResponse
from app.infrastructure.api.dto.request.update_videogame_profile_request import UpdateGameProfileRequest
from app.infrastructure.api.dto.response.get.get_videogame_profiles_response import GetVideogameProfilesResponse
from app.infrastructure.api.dto.response.update_videogame_profile_response import UpdateGameProfileResponse
from app.application.use_cases.link_riot_account import LinkRiotAccount
from app.application.use_cases.query_riot_account_link import QueryRiotAccountLink
from app.application.use_cases.refresh_riot_stats import RefreshRiotStats
from app.application.use_cases.unlink_riot_account import UnlinkRiotAccount
from app.infrastructure.api.dto.request.link_riot_account_request import LinkRiotAccountRequest
from app.infrastructure.api.dto.response.delete.delete_riot_account_link_response import DeleteRiotAccountLinkResponse
from app.infrastructure.api.dto.response.get.get_riot_account_link_response import GetRiotAccountLinkResponse
from app.infrastructure.config.settings import settings
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory
from app.infrastructure.riot_api.riot_game_provider_resolver_impl import RiotGameProviderResolverImpl
from app.application.use_cases.delete_game_profile import DeleteGameProfileUseCase
from app.infrastructure.api.dto.response.delete.delete_game_profile_response import DeleteGameProfileResponse

router = APIRouter(prefix="/api/v1/game_profiles", tags=["Game Profiles"])

def get_riot_provider_resolver():
    return RiotGameProviderResolverImpl()

def get_riot_refresh_cooldown() -> timedelta:
    return timedelta(minutes=settings.riot_stats_refresh_cooldown_minutes)

@router.post("/", status_code=201, response_model = CreateGameProfileResponse, dependencies=[Depends(require_player)])
def create_game_profile(request: CreateGameProfileRequest, player_id: int = Depends(get_current_user_id)):
    uow = uow_factory()
    create_game_profile_use_case = CreateVideogameProfile(uow)
    game_profile = create_game_profile_use_case.execute(player_id, request)
    profile_id = game_profile.game_profile_id
    response = CreateGameProfileResponse(profile_id=profile_id)
    return response

@router.put("/{game_profile_id}", response_model=UpdateGameProfileResponse, status_code=200, dependencies=[Depends(require_player)])
def update_game_profile(game_profile_id: int, request: UpdateGameProfileRequest, player_id: int = Depends(get_current_user_id)):
    uow = uow_factory()
    update_game_profile_use_case = UpdateVideogameProfile(uow)
    updated_game_profile = update_game_profile_use_case.execute(player_id, game_profile_id, request)

    response = updated_game_profile
    return response

@router.post("/search", response_model=GetVideogameProfilesResponse, dependencies=[Depends(require_player)])
def search_game_profile(request: SearchVideogameProfilesRequest, player_id: int = Depends(get_current_user_id)):
    uow = uow_factory()
    search_game_profiles_use_case = SearchVideogameProfilePlayer(uow)
    game_profiles = search_game_profiles_use_case.execute(request, player_id)

    response = game_profiles
    return response

@router.delete("/{game_profile_id}", response_model=DeleteGameProfileResponse, status_code=200)
def delete_game_profile(game_profile_id: int, token_data: dict = Depends(require_player)) -> DeleteGameProfileResponse:
    uow = uow_factory()
    return DeleteGameProfileUseCase(uow).execute(
        game_profile_id=game_profile_id,
        player_id=token_data["user_id"],
        requester_role=token_data["role"],
    )


# ---------------------------------------------------------
# Cuenta de Riot vinculada al perfil de juego (League of Legends o Valorant)
# ---------------------------------------------------------

@router.get("/{game_profile_id}/riot", response_model=GetRiotAccountLinkResponse, status_code=200, dependencies=[Depends(require_player)])
def get_riot_account_link(game_profile_id: int):
    # Estadísticas guardadas: las ve cualquier jugador que entre al perfil, sin consultar a Riot
    uow = uow_factory()
    use_case = QueryRiotAccountLink(get_riot_provider_resolver(), uow, get_riot_refresh_cooldown())
    return use_case.execute(game_profile_id)

@router.post("/{game_profile_id}/riot", response_model=GetRiotAccountLinkResponse, status_code=200, dependencies=[Depends(require_player)])
def link_riot_account(game_profile_id: int, request: LinkRiotAccountRequest, player_id: int = Depends(get_current_user_id)):
    uow = uow_factory()
    use_case = LinkRiotAccount(get_riot_provider_resolver(), uow, get_riot_refresh_cooldown())
    return use_case.execute(player_id, game_profile_id, request.riot_id, request.server)

@router.post("/{game_profile_id}/riot/refresh", response_model=GetRiotAccountLinkResponse, status_code=200, dependencies=[Depends(require_player)])
def refresh_riot_stats(game_profile_id: int, player_id: int = Depends(get_current_user_id)):
    uow = uow_factory()
    use_case = RefreshRiotStats(get_riot_provider_resolver(), uow, get_riot_refresh_cooldown())
    return use_case.execute(player_id, game_profile_id)

@router.delete("/{game_profile_id}/riot", response_model=DeleteRiotAccountLinkResponse, status_code=200, dependencies=[Depends(require_player)])
def unlink_riot_account(game_profile_id: int, player_id: int = Depends(get_current_user_id)):
    uow = uow_factory()
    use_case = UnlinkRiotAccount(uow)
    return use_case.execute(player_id, game_profile_id)
