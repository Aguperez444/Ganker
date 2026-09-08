from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile

from app.application.use_cases.query_videogames import QueryVideogames
from app.application.use_cases.register_videogame import RegisterVideogame
from app.application.use_cases.update_videogame import UpdateVideogame
from app.infrastructure.api.dto.response.get_videogames_response import GetVideogamesResponse
from app.infrastructure.api.dto.response.base_classes.videogame_object_response import VideogameObjectResponse
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory
from app.infrastructure.api.dependencies.auth import get_current_user_id, require_admin, require_player
from app.infrastructure.storage.local_disk_storage_service import LocalDiskStorageService

router = APIRouter(prefix="/api/v1/videogames", tags=["Videogames"])

def get_storage_service():
    return LocalDiskStorageService()
@router.post("/", status_code=201, response_model=VideogameObjectResponse, dependencies=[Depends(require_admin)])
def register_videogame(
    name: str = Form(..., description="Name of the videogame"),
    icon: UploadFile = File(..., description="Icon image file"),
    rank_per_role: bool = Form(..., description="Whether the videogame ranks players per role"),
):

    # Asegurarse de que la petición incluya un archivo con nombre
    if not icon or not icon.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo es obligatorio y debe tener un nombre válido."
        )

    uow = uow_factory()
    storage_service = get_storage_service()
    register_videogame_use_case = RegisterVideogame(storage_service, uow)
    videogame = register_videogame_use_case.execute(name, icon.file, icon.filename, rank_per_role)

    return videogame

@router.put("/{videogame_id}", status_code=200, response_model=VideogameObjectResponse, dependencies=[Depends(require_admin)])
def update_videogame(
    videogame_id: int,
    name: str = Form(..., description="Name of the videogame"),
    icon: UploadFile | None = File(None, description="Icon image file"),
    rank_per_role: bool = Form(..., description="Whether the videogame ranks players per role"),
):

    if not icon or not icon.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo es obligatorio y debe tener un nombre válido."
        )

    uow = uow_factory()
    storage_service = get_storage_service()
    update_videogame_use_case = UpdateVideogame(storage_service, uow)

    updated_videogame = update_videogame_use_case.execute(videogame_id, name, icon, rank_per_role)

    return updated_videogame


@router.get("/", response_model=GetVideogamesResponse, status_code=200, dependencies=[Depends(require_player)])
def get_all_videogames():
    uow = uow_factory()
    query_games_use_case = QueryVideogames(uow)
    return query_games_use_case.get_all_videogames()
