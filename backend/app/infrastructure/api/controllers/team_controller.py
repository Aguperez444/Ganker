from fastapi import APIRouter, Depends, Query
from starlette.concurrency import run_in_threadpool
from typing import Optional

from app.application.use_cases.join_team import JoinTeam
from app.application.use_cases.create_team import CreateTeam
from app.application.use_cases.search_teams import SearchTeams
from app.infrastructure.api.dependencies.auth import get_current_user_id, require_player
from app.infrastructure.api.dto.request.join_team_request import JoinTeamRequest
from app.infrastructure.api.dto.request.create_team_request import CreateTeamRequest
from app.infrastructure.api.dto.response.team.event_type_enum import TeamEventTypeEnum
from app.infrastructure.api.teams.teams_feed_connection_manager import teams_feed_manager
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory


router = APIRouter(prefix="/api/v1/teams", tags=["teams"])

@router.get("", status_code=200, dependencies=[Depends(require_player)])
async def search_teams(
    videogame_id: Optional[int] = Query(None),
    region_id: Optional[int] = Query(None),
    rank_id: Optional[int] = Query(None),
    vacant_slots: Optional[int] = Query(None),
    role_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
):
    uow = uow_factory()
    use_case = SearchTeams(uow)
    results = await run_in_threadpool(
        use_case.execute,
        videogame_id=videogame_id,
        region_id=region_id,
        rank_id=rank_id,
        vacant_slots=vacant_slots,
        role_id=role_id,
        search=search
    )
    return results

@router.post("", status_code=201, dependencies=[Depends(require_player)])
async def create_team(
    payload: CreateTeamRequest,
    user_id: int = Depends(get_current_user_id),
):
    uow = uow_factory()
    use_case = CreateTeam(uow)

    created_team_data = await run_in_threadpool(use_case.execute, user_id, payload)

    # Convertir la respuesta de CreateTeamSummaryService a un diccionario para la serialización JSON, si es necesario.
    # Podemos confiar en la serialización del modelo de respuesta de FastAPI, pero para los WebSockets debemos convertirla en un diccionario.
    await teams_feed_manager.broadcast_event(TeamEventTypeEnum.TEAM_CREATED, created_team_data.model_dump())

    return created_team_data

@router.post("/{team_id}/join", status_code=200, dependencies=[Depends(require_player)])
async def join_lobby(
    team_id: int,
    payload: JoinTeamRequest,
    user_id: int = Depends(get_current_user_id),
):
    uow = uow_factory()
    use_case = JoinTeam(uow)


    updated_lobby_data = await run_in_threadpool(use_case.execute, team_id, user_id, payload.target_team_member_role_id)


    # Notificamos a todos los que tienen la lista de salas abierta en el navegador
    await teams_feed_manager.broadcast_event(TeamEventTypeEnum.TEAM_MEMBER_JOINED, updated_lobby_data.model_dump())

    return {"status": "success", "data": updated_lobby_data}