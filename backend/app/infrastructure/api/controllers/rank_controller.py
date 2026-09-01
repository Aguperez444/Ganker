from fastapi import APIRouter, Depends

from app.application.useCases.query_ranks import QueryRanks
from app.infrastructure.api.dependencies.auth import get_current_player_id
from app.infrastructure.api.dto.get_ranks_response import GetRanksResponse

from app.infrastructure.database.unit_of_work.uow_factory import uow_factory

router = APIRouter(prefix="/api/v1/ranks")

@router.get("/{videogame_id}", response_model=GetRanksResponse, status_code=200)
def get_ranks_by_videogame_id(videogame_id: int, _player_id: int = Depends(get_current_player_id)):
    # lo del player_id está para que el endpoint esté protegido, pero no se usa en la lógica de este endpoint
    uow = uow_factory()
    query_ranks_use_case = QueryRanks(uow)
    return query_ranks_use_case.get_by_game_id(videogame_id)

