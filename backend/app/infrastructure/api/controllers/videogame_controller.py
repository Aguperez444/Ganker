from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile

from app.application.useCases.query_videogame import QueryVideogames
from app.application.useCases.register_videogame import RegisterVideogame
from app.application.useCases.update_videogame import UpdateVideogame
from app.infrastructure.api.dto.get_videogames_response import GetVideogamesResponse
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory
from app.infrastructure.api.dependencies.auth import get_current_player_id
from app.infrastructure.storage.local_disk_storage_service import LocalDiskStorageService

router = APIRouter(prefix="/api/v1/videogames")

def get_storage_service():
    return LocalDiskStorageService()
@router.post("/", status_code=201)
async def register_videogame(name: str = Form(..., description="Name of the rank"),
    icon: UploadFile = File(..., description="Icon image file"), _player_id: int = Depends(get_current_player_id)):


    # Asegurarse de que la petición incluya un archivo con nombre
    if not icon or not icon.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo es obligatorio y debe tener un nombre válido."
        )

    uow = uow_factory()
    storage_service = get_storage_service()
    register_videogame_use_case = RegisterVideogame(storage_service, uow)
    videogame = await register_videogame_use_case.execute(name, icon.file, icon.filename)

    return videogame

@router.put("/{videogame_id}", status_code=200)
async def update_videogame(videogame_id: int, name: str = Form(..., description="Name of the rank"),
                           icon: UploadFile = File(..., description="Icon image file"),
                           _player_id: int = Depends(get_current_player_id)):

    if not icon or not icon.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo es obligatorio y debe tener un nombre válido."
        )

    uow = uow_factory()
    storage_service = get_storage_service()
    update_videogame_use_case = UpdateVideogame(storage_service, uow)

    updated_videogame = await update_videogame_use_case.execute(videogame_id, name, icon)

    return updated_videogame


@router.get("/", response_model=GetVideogamesResponse, status_code=200)
def get_all_videogames(_player_id: int = Depends(get_current_player_id)):
    # lo del player_id está para que el endpoint esté protegido, pero no se usa en la lógica de este endpoint
    uow = uow_factory()
    query_games_use_case = QueryVideogames(uow)
    return query_games_use_case.get_all_videogames()
