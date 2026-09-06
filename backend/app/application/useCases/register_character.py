from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.character_name_invalid_exception import CharacterNameInvalidException
from app.domain.exceptions.name_file_not_null_exception import NameFileNotNullException
from app.domain.models.character import Character
from app.domain.exceptions.file_not_null_exception import FileNotNullException
from exceptions.videogame.videogame_not_found_exception import VideogameNotFoundException


class RegisterCharacter:
    def __init__(self,storage_service: IStorageService, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work
        self.storage_service: IStorageService = storage_service

    async def execute(self, name: str, videogame_id: int, icon_file, icon_filename):
        cleaned_name = self.validate_character_name(name)
        self.validate_name_uniqueness(cleaned_name, videogame_id)
        if not icon_file:
            raise FileNotNullException()
        if icon_file and not icon_filename:
            raise NameFileNotNullException()

        with self.uow as uow:
            # Guardar imagen a través del puerto si se proporciona un archivo
            icon_url = await self.storage_service.save_file(
                file_content=icon_file,
                filename=icon_filename,
                subfolder=f"characters/{videogame_id}",
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

        return saved_character

    @staticmethod
    def validate_character_name(name: str) -> str:
        if not name or not name.strip():
            raise CharacterNameInvalidException(name)
        return name.strip()

    def validate_name_uniqueness(self, character_id: int, name: str, videogame_id: int):
        with self.uow as uow:
            existing_character = uow.character_repo.get_character_by_name_and_videogame(name, videogame_id)
            if existing_character and existing_character.character_id != character_id:
                raise CharacterNameInvalidException(name)
            return True