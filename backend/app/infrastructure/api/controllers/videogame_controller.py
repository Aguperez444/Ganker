from fastapi import APIRouter

from app.application.useCases.register_videogame import RegisterVideogame
from app.infrastructure.api.dto.register_videogame_request import RegisterVideogameRequest
from app.infrastructure.api.dto.register_videogame_response import RegisterVideogameResponse
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


