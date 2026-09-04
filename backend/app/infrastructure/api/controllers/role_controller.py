from fastapi import APIRouter, Depends, Form, UploadFile, File, HTTPException, status

from app.application.useCases.create_rol import CreateRoleUseCase
from app.application.useCases.query_roles import QueryRoles
from app.infrastructure.api.dependencies.auth import get_current_player_id

from app.infrastructure.api.dto.get_roles_response import GetRolesResponse
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory
from app.infrastructure.storage.local_disk_storage_service import LocalDiskStorageService

router = APIRouter(prefix="/api/v1/roles")

def get_storage_service():
    return LocalDiskStorageService()



@router.get("/{videogame_id}", response_model=GetRolesResponse, status_code=200)
def get_roles_by_videogame_id(videogame_id: int, _player_id: int = Depends(get_current_player_id)):
    # lo del player_id está para que el endpoint esté protegido, pero no se usa en la lógica de este endpoint
    uow = uow_factory()
    query_roles_use_case = QueryRoles(uow)
    return query_roles_use_case.get_by_game_id(videogame_id)


@router.post("", status_code=201)
async def create_game_rank(
    videogame_id: int = Form(..., description="ID of the videogame"),
    name: str = Form(..., description="Name of the rank"),
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
    use_case = CreateRoleUseCase(storage_service=storage_service, uow=uow)

    result = await use_case.execute(
        game_id=videogame_id,
        name=name,
        icon_stream=icon.file,
        filename=icon.filename,
    )

    return result