from typing import Annotated
from datetime import timedelta

from fastapi import APIRouter, Depends, Query

from app.application.use_cases.ban_player import BanPlayer
from app.application.use_cases.report_player import ReportPlayer
from app.application.use_cases.query_active_bans import QueryActiveBans
from app.application.use_cases.search_banned_players import SearchBannedPlayers
from app.application.use_cases.search_reports_players import SearchReportsPlayers
from app.application.use_cases.unban_player import UnbanPlayer
from app.infrastructure.api.dependencies.auth import get_current_user_id, require_player, require_admin
from app.infrastructure.api.dto.request.ban_player_request import BanPlayerRequest
from app.infrastructure.api.dto.request.report_player_request import ReportPlayerRequest
from app.infrastructure.api.dto.request.search_banned_players_request import SearchBannedPlayersRequest
from app.infrastructure.api.dto.request.search_reported_players_request import SearchReportedPlayersRequest
from app.infrastructure.api.dto.response.list_search_banned_players_response import ListSearchBannedPlayersResponse
from app.infrastructure.api.dto.response.list_search_reported_players_response import ListSearchReportedPlayersResponse
from app.infrastructure.api.dto.response.report_player_response import ReportPlayerResponse
from app.infrastructure.api.dto.response.active_banned_players_response import ActiveBannedPlayersResponse
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory
from app.infrastructure.config.settings import settings

router = APIRouter(prefix="/api/v1/moderation", tags=["Moderation"])


@router.get("/banned-players/active", response_model=ActiveBannedPlayersResponse,
            status_code=200, dependencies=[Depends(require_admin)])
def get_active_banned_players(
    username: Annotated[str | None, Query(max_length=100)] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
):
    return QueryActiveBans(uow_factory()).execute(username=username, skip=skip, limit=limit)


# ENDPOINT PARA REPORTAR UN JUGADOR
@router.post("/", response_model=ReportPlayerResponse ,status_code=201, dependencies=[Depends(require_player)])
def report_player(report_request: ReportPlayerRequest, reporter_id: int = Depends(get_current_user_id)):
    uow = uow_factory()
    use_case = ReportPlayer(uow, cooldown=timedelta(seconds=settings.player_report_cooldown_seconds))
    new_report = use_case.execute(report_request, reporter_id)

    return new_report

# ENDPOINT PARA BUSCAR REPORTES CON FILTRO
@router.get("/reported_players", response_model=ListSearchReportedPlayersResponse, status_code=200, dependencies=[Depends(require_admin)])
def search_reported_players(request: Annotated[SearchReportedPlayersRequest, Query()]):
    uow = uow_factory()
    use_case = SearchReportsPlayers(uow)
    reports_players = use_case.execute(
        reported_by=request.reported_by,
        reported_user=request.reported_user,
        status=request.status,
        reason=request.reason,
        resolved_by=request.resolved_by,
        min_create_date=request.min_create_date,
        max_create_date=request.max_create_date,
        min_resolve_date=request.min_resolve_date,
        max_resolve_date=request.max_resolve_date,
        skip=request.skip,
        limit=request.limit
    )
    return ListSearchReportedPlayersResponse(reports=reports_players)


# ENDPOINT PARA BANEAR UN JUGADOR
@router.post("/ban", status_code=200, dependencies=[Depends(require_admin)])
def ban_player(ban_request: BanPlayerRequest, admin_id: int = Depends(get_current_user_id)):
    uow = uow_factory()
    use_case = BanPlayer(uow)
    use_case.execute(ban_request, admin_id)
    return "Jugador baneado exitosamente"

# ENDPOINT PARA DESBANEAR UN JUGADOR MANUALMENTE
@router.post("/{player_id}/unban", status_code=200, dependencies=[Depends(require_admin)])
def unban_player(player_id: int, admin_id: int = Depends(get_current_user_id)):
    uow = uow_factory()
    use_case = UnbanPlayer(uow)
    use_case.execute(player_id, admin_id)
    return "Jugador desbaneado exitosamente"

# ENDPOINT PARA BUSCAR JUGADORES BANEADOS
@router.get("/banned-players", response_model=ListSearchBannedPlayersResponse, status_code=200, dependencies=[Depends(require_admin)])
def search_banned_players(request: Annotated[SearchBannedPlayersRequest, Query()]):
    uow = uow_factory()
    use_case = SearchBannedPlayers(uow)
    banned_players = use_case.execute(
        banned_by=request.banned_by,
        banned_user=request.banned_user,
        min_date_create=request.min_date_create,
        max_date_create=request.max_date_create,
        min_date_expire=request.min_date_expire,
        max_date_expire=request.max_date_expire,
        reason=request.reason,
        skip=request.skip,
        limit=request.limit
    )
    return ListSearchBannedPlayersResponse(list_banned_players=banned_players)
