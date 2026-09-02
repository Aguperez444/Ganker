from fastapi import APIRouter, Depends

from app.application.useCases.query_roles import QueryRoles
from app.infrastructure.api.dependencies.auth import get_current_player_id

from app.infrastructure.api.dto.get_roles_response import GetRolesResponse
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory

router = APIRouter(prefix="/api/v1/roles")




@router.get("/{videogame_id}", response_model=GetRolesResponse, status_code=200)
def get_roles_by_videogame_id(videogame_id: int, _player_id: int = Depends(get_current_player_id)):
    # lo del player_id está para que el endpoint esté protegido, pero no se usa en la lógica de este endpoint
    uow = uow_factory()
    query_roles_use_case = QueryRoles(uow)
    return query_roles_use_case.get_by_game_id(videogame_id)

