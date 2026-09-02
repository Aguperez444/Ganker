from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, status


from app.application.useCases.create_rank import CreateRankUseCase
from app.application.useCases.query_ranks import QueryRanks
from app.infrastructure.api.dependencies.auth import get_current_player_id
from app.infrastructure.api.dto.get_ranks_response import GetRanksResponse

from app.infrastructure.database.unit_of_work.uow_factory import uow_factory
from app.infrastructure.storage.local_disk_storage_service import LocalDiskStorageService

router = APIRouter(prefix="/api/v1/ranks")

# está hecho asi por si después hay que cambiar el storage service por algún otro, solo habría que cambiarlo aquí y no en cada endpoint
def get_storage_service():
    return LocalDiskStorageService()

@router.get("/{videogame_id}", response_model=GetRanksResponse, status_code=200)
def get_ranks_by_videogame_id(videogame_id: int, _player_id: int = Depends(get_current_player_id)):
    # lo del player_id está para que el endpoint esté protegido, pero no se usa en la lógica de este endpoint
    uow = uow_factory()
    query_ranks_use_case = QueryRanks(uow)
    return query_ranks_use_case.get_by_game_id(videogame_id)


@router.post("", status_code=201)
async def create_game_rank(
    videogame_id: int = Form(..., description="ID of the videogame"),
    name: str = Form(..., description="Name of the rank"),
    value: int = Form(..., description="Value of the rank"),
    icon: UploadFile = File(..., description="Icon image file"),
    _player_id: int = Depends(get_current_player_id)
):
    # Asegurarse de que la petición incluya un archivo con nombre
    if not icon.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo de ícono debe tener un nombre válido."
        )

    uow = uow_factory()
    storage_service = get_storage_service()
    use_case = CreateRankUseCase(storage_service=storage_service, uow=uow)

    result = await use_case.execute(
        game_id=videogame_id,
        name=name,
        icon_stream=icon.file,
        filename=icon.filename,
        value=value
    )
    return result
