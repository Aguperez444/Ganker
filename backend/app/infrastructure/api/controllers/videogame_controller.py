from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from pydantic import AliasPath

from app.application.use_cases.query_videogames import QueryVideogames
from app.application.use_cases.register_videogame import RegisterVideogame
from app.application.use_cases.update_videogame import UpdateVideogame
from app.infrastructure.api.dto.response.get.get_videogames_response import GetVideogamesResponse
from app.infrastructure.api.dto.response.base_classes.videogame_object_response import VideogameObjectResponse
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory
from app.infrastructure.api.dependencies.auth import require_admin, require_player, require_owner
from app.infrastructure.storage.local_disk_storage_service import LocalDiskStorageService
from app.application.use_cases.delete_videogame import DeleteVideogameUseCase
from app.infrastructure.api.dto.response.delete.delete_videogame_response import DeleteVideogameResponse

router = APIRouter(prefix="/api/v1/videogames", tags=["Videogames"])

def get_storage_service():
    return LocalDiskStorageService()
@router.post("/", status_code=201, response_model=VideogameObjectResponse, dependencies=[Depends(require_admin)])
def register_videogame(
    name: str = Form(..., description="Nombre del videojuego"),
    icon: UploadFile = File(..., description="Archivo de imagen del ícono"),
    rank_per_role: bool = Form(..., description="Indica si el videojuego rankea a los jugadores por rol"),
    has_characters: bool = Form(
        True,
        validation_alias=AliasPath("has_characters"),
        description="Indica si el videojuego posee selección de personajes",
    ),
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
    videogame = register_videogame_use_case.execute(name, icon.file, icon.filename, rank_per_role, has_characters)

    return videogame

@router.put("/{videogame_id}", status_code=200, response_model=VideogameObjectResponse, dependencies=[Depends(require_admin)])
def update_videogame(
    videogame_id: int,
    name: str = Form(..., description="Nombre del videojuego"),
    icon: UploadFile | None = File(None, description="Archivo de imagen del ícono"),
    rank_per_role: bool = Form(..., description="Indica si el videojuego rankea a los jugadores por rol"),
    has_characters: bool = Form(
        True,
        validation_alias=AliasPath("has_characters"),
        description="Indica si el videojuego posee selección de personajes",
    ),
):

    if icon and not icon.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe tener un nombre válido."
        )

    uow = uow_factory()
    storage_service = get_storage_service()
    update_videogame_use_case = UpdateVideogame(storage_service, uow)

    updated_videogame = update_videogame_use_case.execute(
        videogame_id=videogame_id,
        name=name,
        icon_file=icon.file if icon is not None else None,
        icon_filename=icon.filename if icon is not None else None,
        rank_per_role=rank_per_role,
        has_characters=has_characters,
    )

    return updated_videogame


@router.get("/", response_model=GetVideogamesResponse, status_code=200, dependencies=[Depends(require_player)])
def get_all_videogames():
    uow = uow_factory()
    query_games_use_case = QueryVideogames(uow)
    return query_games_use_case.get_all_videogames()

@router.delete("/{videogame_id}", response_model=DeleteVideogameResponse, status_code=200, dependencies=[Depends(require_owner)])
def delete_videogame(videogame_id: int) -> DeleteVideogameResponse:
    uow = uow_factory()
    return DeleteVideogameUseCase(uow).execute(videogame_id)
