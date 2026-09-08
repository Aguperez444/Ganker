from typing import cast

from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.models.videogame import Videogame
from app.domain.exceptions.videogame.invalid_videogame_name_exception import InvalidVideogameNameException
from app.domain.exceptions.videogame.videogame_already_exists_exception import VideogameAlreadyExistsException
from app.domain.exceptions.file.file_name_not_null_exception import FileNameNotNullException
from app.domain.exceptions.file.file_not_null_exception import FileNotNullException
from app.domain.services.slug_service import SlugService
from app.infrastructure.api.dto.response.base_classes.videogame_object_response import VideogameObjectResponse



class RegisterVideogame:
    def __init__(self, storage_service: IStorageService,unit_of_work: IUnitOfWork):
        self.storage_service: IStorageService = storage_service
        self.uow: IUnitOfWork = unit_of_work


    def execute(self, name: str, icon_file, icon_filename) -> VideogameObjectResponse:

        cleaned_name = self.validate_videogame_name(name)
        self.validate_name_uniqueness(cleaned_name)
        if not icon_file:
            raise FileNotNullException()
        if icon_file and not icon_filename:
            raise FileNameNotNullException()

        game_folder = SlugService.to_slug(cleaned_name)

        with self.uow as uow:
            # Guardar imagen a través del puerto
            icon_url = self.storage_service.save_image_file(
                file_content=icon_file,
                filename=icon_filename,
                subfolder=f"games/{game_folder}",
                preserve_original_name=True
            )

            # Crear el nuevo videojuego
            new_videogame: Videogame = Videogame(
                videogame_id=None,
                name=cleaned_name,
                icon_url=icon_url,
            )

            try:
                # Persistir el nuevo videojuego en la base de datos
                saved_videogame = uow.videogame_repo.register_videogame(new_videogame)
            except Exception as e:
                # Evitar basura en disco si la BD rechaza la inserción
                self.storage_service.delete_file(icon_url)
                raise e  # volver a levantar la excepción después de limpiar el archivo para hacer rollback

        return VideogameObjectResponse(
            id=cast(int, saved_videogame.videogame_id),
            name=saved_videogame.name,
            icon_url=saved_videogame.icon_url or "Sin icono",
        )

    # Validar que el nombre del videojuego no esté vacío
    @staticmethod
    def validate_videogame_name(name: str) -> str:
        if not name or not name.strip():
            raise InvalidVideogameNameException(name)
        return name.strip()

    # Validar que el nombre no exista en la base de datos
    def validate_name_uniqueness(self, cleaned_name: str) -> bool:
        with self.uow as uow:
            existing_videogame = uow.videogame_repo.get_videogame_by_name(cleaned_name.lower())
            if existing_videogame:
                raise VideogameAlreadyExistsException(cleaned_name)
            return True
