from fastapi import APIRouter

from app.application.useCases.register_videogame import RegisterVideogame
from app.application.useCases.update_videogame import UpdateVideogame
from app.infrastructure.api.dto.register_videogame_request import RegisterVideogameRequest
from app.infrastructure.api.dto.register_videogame_response import RegisterVideogameResponse
from app.infrastructure.api.dto.update_videogame_request import UpdateVideogameRequest
from app.infrastructure.api.dto.update_videogame_response import UpdateVideogameResponse
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory

router = APIRouter(prefix="/api/v1/videogames")

@router.post("/", response_model=RegisterVideogameResponse, status_code=201)
def register_videogame(request: RegisterVideogameRequest):
    uow = uow_factory()
    register_videogame_use_case = RegisterVideogame(uow)
    videogame = register_videogame_use_case.execute(request)
    response = RegisterVideogameResponse(
        videogame_id=videogame.videogame_id,
        name=videogame.name
    )
    return response

@router.put("/{videogame_id}", response_model=UpdateVideogameResponse, status_code=200)
def update_videogame(videogame_id: int, request: UpdateVideogameRequest):
    uow = uow_factory()
    update_videogame_use_case = UpdateVideogame(uow)
    updated_videogame = update_videogame_use_case.execute(videogame_id, request)
    return UpdateVideogameResponse(
        videogame_id=updated_videogame.videogame_id,
        name=updated_videogame.name
    )

