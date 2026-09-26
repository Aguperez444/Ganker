from typing import cast

from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.models.videogame import Videogame
from app.domain.exceptions.file.file_name_not_null_exception import FileNameNotNullException
from app.domain.exceptions.file.file_not_null_exception import FileNotNullException
from app.domain.services.slug_service import SlugService
from app.infrastructure.api.dto.response.base_classes.videogame_object_response import VideogameObjectResponse
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.services.static_validation_service import StaticValidationService




class RegisterVideogame:
    def __init__(self, storage_service: IStorageService, unit_of_work: IUnitOfWork):
        self.storage_service: IStorageService = storage_service
        self.uow: IUnitOfWork = unit_of_work

    def execute(self, name: str, icon_file, icon_filename, rank_per_role: bool) -> VideogameObjectResponse:
        cleaned_name = StaticValidationService.validate_videogame_name_format(name)

        with self.uow as uow:
            CatalogValidationService.validate_new_videogame_name_uniqueness(cleaned_name, uow=uow)
            if not icon_file:
                raise FileNotNullException()
            if icon_file and not icon_filename:
                raise FileNameNotNullException()

            game_folder = SlugService.to_slug(cleaned_name)

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
                rank_per_role=rank_per_role,
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
            rank_per_role=saved_videogame.rank_per_role,
        )
