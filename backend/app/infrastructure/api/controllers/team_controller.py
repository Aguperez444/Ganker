from fastapi import APIRouter, Depends, Query, UploadFile, File
from starlette.concurrency import run_in_threadpool
from typing import Optional

from app.application.use_cases.get_team import GetTeam
from app.application.use_cases.join_team import JoinTeam
from app.application.use_cases.create_team import CreateTeam
from app.application.use_cases.search_teams import SearchTeams
from app.infrastructure.api.chat.user_notification_manager import notification_manager
from app.infrastructure.api.dependencies.auth import get_current_user_id, require_player
from app.infrastructure.api.dto.request.join_team_request import JoinTeamRequest
from app.infrastructure.api.dto.request.create_team_request import CreateTeamRequest
from app.infrastructure.api.dto.response.notification.notification_type_enum import NotificationType
from app.infrastructure.api.dto.response.team.event_type_enum import TeamEventTypeEnum
from app.infrastructure.api.dto.response.team_summary import TeamSummaryResponse, JoinTeamResponse
from app.infrastructure.api.teams.teams_feed_connection_manager import teams_feed_manager
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory
from app.infrastructure.storage.local_disk_storage_service import LocalDiskStorageService

router = APIRouter(prefix="/api/v1/teams", tags=["teams"])



def get_storage_service():
    return LocalDiskStorageService()

@router.get("", status_code=200, response_model=list[TeamSummaryResponse], dependencies=[Depends(require_player)])
async def search_teams(
    videogame_id: Optional[int] = Query(None),
    region_id: Optional[int] = Query(None),
    rank_id: Optional[int] = Query(None),
    vacant_slots: Optional[int] = Query(None, ge=1),
    role_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    user_id: int = Depends(get_current_user_id),
):
    uow = uow_factory()
    use_case = SearchTeams(uow)
    return await run_in_threadpool(
        use_case.execute,
        videogame_id=videogame_id,
        region_id=region_id,
        rank_id=rank_id,
        vacant_slots=vacant_slots,
        role_id=role_id,
        search=search,
        user_id=user_id,
        limit=size,
        offset=(page - 1) * size
    )


@router.post("", status_code=201, response_model=TeamSummaryResponse, dependencies=[Depends(require_player)])
async def create_team(
    payload: CreateTeamRequest,
    team_icon: Optional[UploadFile] = File(None, description="Archivo de imagen del ícono del equipo"),
    user_id: int = Depends(get_current_user_id),
):

    file_obj = team_icon.file if team_icon else None

    uow = uow_factory()
    storage_service = get_storage_service()
    use_case = CreateTeam(uow, storage_service)

    created_team_data: TeamSummaryResponse = await run_in_threadpool(use_case.execute, user_id, payload, file_obj)

    # Para los WebSockets debemos convertir la respuesta en un diccionario (sin datos propios del creador)
    await teams_feed_manager.broadcast_event(TeamEventTypeEnum.TEAM_CREATED, created_team_data.public_payload())

    return created_team_data


@router.get("/me", status_code=200, response_model=Optional[TeamSummaryResponse], dependencies=[Depends(require_player)])
async def get_my_team(user_id: int = Depends(get_current_user_id)):
    """Equipo activo del jugador (null si no pertenece a ninguno)."""
    uow = uow_factory()
    return await run_in_threadpool(GetTeam(uow).my_active_team, user_id)


@router.get("/{team_id}", status_code=200, response_model=TeamSummaryResponse, dependencies=[Depends(require_player)])
async def get_team(team_id: int, user_id: int = Depends(get_current_user_id)):
    uow = uow_factory()
    return await run_in_threadpool(GetTeam(uow).by_id, team_id, user_id)


@router.post("/{team_id}/join", status_code=200, response_model=JoinTeamResponse, dependencies=[Depends(require_player)])
async def join_lobby(
    team_id: int,
    payload: JoinTeamRequest,
    user_id: int = Depends(get_current_user_id),
):
    uow = uow_factory()
    use_case = JoinTeam(uow)

    result = await run_in_threadpool(use_case.execute, team_id, user_id, payload.target_team_member_role_id)
    team = result.data

    # Notificamos a todos los que tienen la lista de salas abierta en el navegador
    await teams_feed_manager.broadcast_event(TeamEventTypeEnum.TEAM_MEMBER_JOINED, team.public_payload())

    # Confirmación personal para quien se unió, por el websocket de notificaciones del usuario
    await notification_manager.send_to_user(user_id, {
        "type": NotificationType.TEAM_JOINED,
        "team_id": team.team_id,
        "team_name": team.team_name,
        "chatroom_id": result.chatroom_id,
        "message": result.message
    })

    # Aviso al resto de los integrantes del equipo
    new_member = next((m for m in team.members if m.user_id == user_id), None)
    for member in team.members:
        if member.user_id is not None and member.user_id != user_id:
            await notification_manager.send_to_user(member.user_id, {
                "type": NotificationType.TEAM_NEW_MEMBER,
                "team_id": team.team_id,
                "team_name": team.team_name,
                "chatroom_id": result.chatroom_id,
                "user_id": user_id,
                "username": new_member.username if new_member else None,
                "message": f"{new_member.username if new_member else 'Un jugador'} se unió al equipo"
            })

    return result
