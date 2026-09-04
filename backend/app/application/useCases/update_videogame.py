from fastapi import UploadFile

from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.models.videogame import Videogame
from app.domain.exceptions.invalid_videogame_name_exception import InvalidVideogameNameException
from app.domain.exceptions.videogame_already_exists_exception import VideogameAlreadyExistsException
from app.domain.exceptions.videogame_not_found_exception import VideogameNotFoundException

class UpdateVideogame:
    def __init__(self, storage_service: IStorageService, unit_of_work: IUnitOfWork):
        self.storage_service: IStorageService = storage_service
        self.uow: IUnitOfWork = unit_of_work

    async def execute(self, videogame_id: int, name: str, icon: UploadFile) -> Videogame:

        existing_game = self.validate_videogame_id(videogame_id)
        cleaned_name = self.validate_videogame_name(name)
        self.validate_name_uniqueness(cleaned_name, videogame_id)

        #actualizar juego
        existing_game.name = cleaned_name
        with self.uow as uow:

            if icon and icon.filename:
                # Guardar la nueva imagen a través del puerto
                new_icon_url = await self.storage_service.save_file(
                    file_content=icon.file,
                    filename=icon.filename,
                    subfolder=f"{existing_game.name}",
                    preserve_original_name=True
                )
                # Eliminar la imagen anterior si existe
                if existing_game.icon_url:
                    await self.storage_service.delete_file(existing_game.icon_url)
                existing_game.icon_url = new_icon_url

            try:
                updated_game = uow.videogame_repo.update_videogame(existing_game)
            except Exception as e:
                # Si hay un error al actualizar, se lanza una excepción
                raise Exception(f"Error al actualizar el videojuego: {str(e)}")

        return updated_game

    # Validar existencia del juego
    def validate_videogame_id(self, videogame_id: int) -> Videogame:
        with self.uow as uow:
            found_videogame = uow.videogame_repo.get_videogame_by_id(videogame_id)
            if not found_videogame:
                raise VideogameNotFoundException(videogame_id)
            return found_videogame

    @staticmethod
    def validate_videogame_name(name: str) -> str:
        if not name or not name.strip():
            raise InvalidVideogameNameException(name)
        return name.strip()

    # Validar que el nombre no exista en la base de datos
    def validate_name_uniqueness(self, cleaned_name: str, current_game_id: int) -> bool:
        with self.uow as uow:
            found_videogame = uow.videogame_repo.get_videogame_by_name(cleaned_name.lower())
            if found_videogame and found_videogame.videogame_id != current_game_id:
                raise VideogameAlreadyExistsException(cleaned_name)
            return True



