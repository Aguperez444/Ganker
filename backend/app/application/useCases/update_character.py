from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.character.invalid_character_name_exception import InvalidCharacterNameException
from app.domain.exceptions.character.character_not_found_exception import CharacterNotFoundException
from app.domain.exceptions.character.duplicated_character_name_exception import DuplicatedCharacterNameException
from app.domain.exceptions.videogame.videogame_not_found_exception import VideogameNotFoundException
from app.domain.services.slug_service import SlugService


from typing import TYPE_CHECKING, cast

from app.infrastructure.api.dto.response.base_classes.character_object_response import CharacterObjectResponse

if TYPE_CHECKING:
    from app.domain.models.videogame import Videogame


class UpdateCharacter:
    def __init__(self, storage_service: IStorageService, uow: IUnitOfWork):
        self.storage_service: IStorageService = storage_service
        self.uow: IUnitOfWork = uow

    async def execute(self, character_id: int, name: str, videogame_id: int, icon) -> CharacterObjectResponse:

        # Validar que el nombre no esté vacío
        if not name.strip():
            raise InvalidCharacterNameException(name)

        # Validar existencia del juego
        videogame = self.validate_videogame_exist(videogame_id)

        # Validar que otro personaje no tenga el mismo nombre
        self.validate_name_uniqueness(character_id, name, videogame_id)


        # Actualizar el personaje en la base de datos
        with self.uow as uow:
            character_repo = uow.character_repo
            character = character_repo.get_character_by_id(character_id)
            if not character:
                raise CharacterNotFoundException(character_id)

            game_folder = SlugService.to_slug(videogame.name)

            if icon and icon.filename:
                # Guardar la nueva imagen a través del puerto
                new_icon_url = await self.storage_service.save_image_file(
                    file_content=icon.file,
                    filename=icon.filename,
                    subfolder=f"games/{game_folder}/characters",
                    preserve_original_name=True
                )

            character.name = name
            character.videogame = videogame
            character.icon_url = new_icon_url

            try:
                updated_character = character_repo.update_character(character)
            except Exception as e:
                # Si hay un error al actualizar, se lanza una excepción
                raise Exception(f"Error al actualizar el personaje: {str(e)}")

        return CharacterObjectResponse(
            character_id=cast(int, updated_character.character_id),
            name=updated_character.name,
            icon_url=updated_character.icon_url or "Sin icono",
        )

    def validate_name_uniqueness(self, character_id: int, name: str, videogame_id: int):
        with self.uow as uow:
            existing_character = uow.character_repo.get_character_by_name_and_videogame(name, videogame_id)
            if existing_character and existing_character.character_id != character_id:
                raise DuplicatedCharacterNameException(name, videogame_id)

    def validate_videogame_exist(self, videogame_id: int) -> 'Videogame':
        with self.uow as uow:
            existing_videogame = uow.videogame_repo.get_videogame_by_id(videogame_id)
            if not existing_videogame:
                raise VideogameNotFoundException(videogame_id)
            return existing_videogame