from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.character.duplicated_character_name_exception import DuplicatedCharacterNameException
from app.domain.exceptions.character.invalid_character_name_exception import InvalidCharacterNameException
from app.domain.exceptions.file_name_not_null_exception import FileNameNotNullException
from app.domain.models.character import Character
from app.domain.exceptions.file_not_null_exception import FileNotNullException
from app.domain.exceptions.videogame.videogame_not_found_exception import VideogameNotFoundException
from app.domain.services.slug_service import SlugService
from app.infrastructure.api.dto.character_object_response import CharacterObjectResponse

from typing import cast

class RegisterCharacter:
    def __init__(self,storage_service: IStorageService, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work
        self.storage_service: IStorageService = storage_service

    async def execute(self, name: str, videogame_id: int, icon_file, icon_filename) -> CharacterObjectResponse:
        cleaned_name = self.validate_character_name(name)

        # Comprobar que existe el juego
        with self.uow as uow:
            game = uow.videogame_repo.get_videogame_by_id(videogame_id)
            if not game:
                raise VideogameNotFoundException(videogame_id)
        # valido que no exista otro personaje con el mismo nombre en el mismo juego
        self.validate_name_uniqueness(cleaned_name, videogame_id)

        # confirmado que este personaje es nuevo y único para ese juego, se puede crear y persistir
        # Sanitizar el nombre del juego para la sub carpeta (ej: "League of Legends" -> "league_of_legends")
        game_folder = SlugService.to_slug(game.name)

        if not icon_file:
            raise FileNotNullException()
        if icon_file and not icon_filename:
            raise FileNameNotNullException()

        with self.uow as uow:
            # Guardar imagen a través del puerto si se proporciona un archivo
            icon_url = await self.storage_service.save_file(
                file_content=icon_file,
                filename=icon_filename,
                subfolder=f"games/{game_folder}/characters",
                preserve_original_name=True
            )

            videogame = uow.videogame_repo.get_videogame_by_id(videogame_id)
            if not videogame:
                raise VideogameNotFoundException(videogame_id)

            # Crear el nuevo personaje
            new_character = Character(
                character_id=None,
                name=cleaned_name,
                videogame=videogame,
                icon_url=icon_url
            )

            try:
                # Persistir el nuevo personaje en la base de datos
                saved_character = uow.character_repo.create_character(new_character)

            except Exception as e:
                # Evitar basura en disco si la BD rechaza la inserción
                if icon_url:
                    await self.storage_service.delete_file(icon_url)
                raise e  # volver a levantar la excepción después de limpiar el archivo para hacer rollback

        return CharacterObjectResponse(
            character_id=cast(int, saved_character.character_id),
            name=saved_character.name,
            icon_url=saved_character.icon_url or "Sin icono"
        )

    @staticmethod
    def validate_character_name(name: str) -> str:
        if not name or not name.strip():
            raise InvalidCharacterNameException(name)
        return name.strip()

    def validate_name_uniqueness(self, name: str, videogame_id: int):
        with self.uow as uow:
            existing_character = uow.character_repo.get_character_by_name_and_videogame(name, videogame_id)
            if existing_character:
                raise DuplicatedCharacterNameException(name, videogame_id)
            return True