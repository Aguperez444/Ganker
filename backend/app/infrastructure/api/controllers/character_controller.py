from fastapi import APIRouter, Depends, UploadFile, HTTPException, status, Form, File

from app.application.useCases.query_characters import QueryCharacters
from app.application.useCases.register_character import RegisterCharacter
from app.application.useCases.update_character import UpdateCharacter
from app.infrastructure.api.dto.character_object_response import CharacterObjectResponse
from app.infrastructure.api.dto.get_characters_response import GetCharactersResponse
from app.infrastructure.api.dependencies.auth import get_current_user_id, require_admin


from app.infrastructure.database.unit_of_work.uow_factory import uow_factory
from app.infrastructure.storage.local_disk_storage_service import LocalDiskStorageService

router = APIRouter(prefix="/api/v1/characters")

def get_storage_service():
    return LocalDiskStorageService()

@router.get("/{videogame_id}", response_model=GetCharactersResponse, status_code=200,dependencies=[Depends(require_admin)])
def get_characters_by_videogame_id(videogame_id: int, _player_id: int = Depends(get_current_user_id)):
    # lo del player_id está para que el endpoint esté protegido, pero no se usa en la lógica de este endpoint
    uow = uow_factory()
    query_characters_use_case = QueryCharacters(uow)
    return query_characters_use_case.get_by_game_id(videogame_id)


@router.post("/", status_code=201, response_model=CharacterObjectResponse)
async def register_character(name: str = Form(..., description="Name of the character"),
                             videogame_id: int = Form(..., description="ID of the videogame"),
                             icon: UploadFile = File(..., description="Icon image file"),
                             _player_id: int = Depends(get_current_user_id)):

    # Asegurarse de que la petición incluya un archivo con nombre
    if not icon or not icon.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo es obligatorio y debe tener un nombre válido."
        )

    uow = uow_factory()
    storage_service = get_storage_service()
    register_character_use_case = RegisterCharacter(storage_service, uow)
    character = await register_character_use_case.execute(name, videogame_id, icon.file, icon.filename)

    return character

@router.put("/{character_id}", status_code=200, response_model=CharacterObjectResponse)
async def update_character(character_id: int,
                           name: str = Form(..., description="Name of the character"),
                           videogame_id: int = Form(..., description="ID of the videogame"),
                           icon: UploadFile = File(description="Icon image file"),
                           _player_id: int = Depends(get_current_user_id)):

    if icon:
        if not icon.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo debe tener un nombre válido."
            )

    uow = uow_factory()
    storage_service = get_storage_service()
    update_character_use_case = UpdateCharacter(storage_service, uow)

    updated_character = await update_character_use_case.execute(character_id, name, videogame_id, icon)

    return updated_character