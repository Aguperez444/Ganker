from fastapi import APIRouter, Depends, Form, UploadFile, File, HTTPException, status

from app.application.use_cases.create_role import CreateRole
from app.application.use_cases.query_roles import QueryRoles
from app.infrastructure.api.dependencies.auth import require_admin, require_player

from app.infrastructure.api.dto.response.get_roles_response import GetRolesResponse
from app.infrastructure.api.dto.response.base_classes.role_object_response import RoleObjectResponse
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory
from app.infrastructure.storage.local_disk_storage_service import LocalDiskStorageService


router = APIRouter(prefix="/api/v1/roles", tags=["Roles"])

def get_storage_service():
    return LocalDiskStorageService()



@router.get("/{videogame_id}", response_model=GetRolesResponse, status_code=200, dependencies=[Depends(require_player)])
def get_roles_by_videogame_id(videogame_id: int):
    # lo del player_id está para que el endpoint esté protegido, pero no se usa en la lógica de este endpoint
    uow = uow_factory()
    query_roles_use_case = QueryRoles(uow)
    return query_roles_use_case.get_by_game_id(videogame_id)


@router.post("", status_code=201, response_model=RoleObjectResponse, dependencies=[Depends(require_admin)])
def create_game_role(
    videogame_id: int = Form(..., description="ID of the videogame"),
    name: str = Form(..., description="Name of the role"),
    icon: UploadFile = File(..., description="Icon image file"),
):
    # Asegurarse de que la petición incluya un archivo con nombre
    if not icon.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo de ícono debe tener un nombre válido."
        )

    uow = uow_factory()
    storage_service = get_storage_service()
    use_case = CreateRole(storage_service=storage_service, uow=uow)

    result = use_case.execute(
        game_id=videogame_id,
        name=name,
        icon_stream=icon.file,
        filename=icon.filename,
    )

    return result