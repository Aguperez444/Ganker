from typing import Annotated
from datetime import timedelta

from fastapi import APIRouter, Depends, Query, Form, File, UploadFile, HTTPException, Path

from app.application.use_cases.ban_player import BanPlayer
from app.application.use_cases.report_player import ReportPlayer
from app.application.use_cases.query_active_bans import QueryActiveBans
from app.application.use_cases.search_banned_players import SearchBannedPlayers
from app.application.use_cases.search_reports_players import SearchReportsPlayers
from app.application.use_cases.unban_player import UnbanPlayer
from app.application.use_cases.dismiss_player_report import DismissPlayerReport
from app.application.use_cases.query_cross_reports import QueryCrossReports
from app.infrastructure.api.dto.response.cross_reports_response import CrossReportsResponse
from app.infrastructure.api.dto.response.search_reported_players_response import SearchReportedPlayersResponse
from app.application.use_cases.query_ban_history import QueryBanHistory
from app.infrastructure.api.dto.response.ban_record_detail_response import BanRecordDetailResponse, PlayerBanHistoryResponse
from app.domain.models.report_reason import ReportReason
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
from app.infrastructure.storage.local_disk_storage_service import LocalDiskStorageService

router = APIRouter(prefix="/api/v1/moderation", tags=["Moderation"])


def get_storage_service():
    return LocalDiskStorageService()


@router.get("/banned-players/active", response_model=ActiveBannedPlayersResponse,
            status_code=200, dependencies=[Depends(require_admin)])
def get_active_banned_players(
    username: Annotated[str | None, Query(max_length=100)] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
):
    return QueryActiveBans(uow_factory()).execute(username=username, skip=skip, limit=limit)


@router.get("/banned-players/{ban_id}", response_model=BanRecordDetailResponse, dependencies=[Depends(require_admin)])
def get_ban_detail(ban_id: Annotated[int, Path(gt=0)]):
    return QueryBanHistory(uow_factory()).get_detail(ban_id)


@router.get("/players/{player_id}/bans", response_model=PlayerBanHistoryResponse, dependencies=[Depends(require_admin)])
def get_player_ban_history(
    player_id: Annotated[int, Path(gt=0)],
    before_ban_id: Annotated[int | None, Query(gt=0)] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
):
    return QueryBanHistory(uow_factory()).execute(player_id, before_ban_id, skip, limit)


# ENDPOINT PARA REPORTAR UN JUGADOR
# Recibe multipart/form-data: la evidencia puede ser una imagen y/o un link de YouTube (ambos opcionales)
@router.post("/", response_model=ReportPlayerResponse ,status_code=201, dependencies=[Depends(require_player)])
def report_player(reported_id: Annotated[int, Form()],
                  reason: Annotated[ReportReason, Form()],
                  description: Annotated[str, Form(max_length=500)] = "",
                  evidence_video_url: Annotated[str | None, Form(max_length=500)] = None,
                  videogame_id: Annotated[int | None, Form(gt=0)] = None,
                  evidence_image: UploadFile | None = File(None, description="Imagen opcional como evidencia"),
                  reporter_id: int = Depends(get_current_user_id)):
    if evidence_image and not evidence_image.filename:
        raise HTTPException(status_code=400, detail="La imagen de evidencia debe tener un nombre válido.")

    # Declarar los campos por separado evita que Form(modelo) + File espere
    # un objeto anidado llamado report_request dentro del multipart.
    report_request = ReportPlayerRequest(
        reported_id=reported_id,
        reason=reason,
        description=description,
        evidence_video_url=evidence_video_url,
        videogame_id=videogame_id,
    )
    uow = uow_factory()
    use_case = ReportPlayer(uow, get_storage_service(),
                            cooldown=timedelta(seconds=settings.player_report_cooldown_seconds))
    new_report = use_case.execute(
        report_request,
        reporter_id,
        evidence_image.file if evidence_image else None,
        evidence_image.filename if evidence_image else None,
    )

    return new_report

# ENDPOINT PARA BUSCAR REPORTES CON FILTRO
@router.get("/reported_players", response_model=ListSearchReportedPlayersResponse, status_code=200, dependencies=[Depends(require_admin)])
def search_reported_players(request: Annotated[SearchReportedPlayersRequest, Query()]):
    uow = uow_factory()
    use_case = SearchReportsPlayers(uow)
    reports_players = use_case.execute(
        reported_by=request.reported_by,
        reported_user=request.reported_user,
        reported_user_id=request.reported_user_id,
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


@router.get("/reports/{report_id}/cross-reports", response_model=CrossReportsResponse, dependencies=[Depends(require_admin)])
def get_cross_reports(
    report_id: Annotated[int, Path(gt=0)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
):
    uow = uow_factory()
    use_case = QueryCrossReports(uow)
    return use_case.execute(report_id, skip, limit)


# ENDPOINT PARA BANEAR UN JUGADOR
@router.post("/reports/{report_id}/dismiss", response_model=SearchReportedPlayersResponse, dependencies=[Depends(require_admin)])
def dismiss_player_report(report_id: Annotated[int, Path(gt=0)], admin_id: int = Depends(get_current_user_id)):
    uow = uow_factory()
    use_case = DismissPlayerReport(uow)
    return use_case.execute(report_id, admin_id)

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
