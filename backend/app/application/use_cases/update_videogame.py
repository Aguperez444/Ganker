from fastapi import UploadFile

from app.application.ports.i_storage_service import IStorageService
from app.domain.exceptions.videogame.videogame_already_exists_exception import VideogameAlreadyExistsException
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.services.slug_service import SlugService


from typing import TYPE_CHECKING, cast

from app.infrastructure.api.dto.response.base_classes.videogame_object_response import VideogameObjectResponse

if TYPE_CHECKING:
    from app.application.ports.i_unit_of_work import IUnitOfWork


class UpdateVideogame:
    def __init__(self, storage_service: IStorageService, unit_of_work: 'IUnitOfWork'):
        self.storage_service: IStorageService = storage_service
        self.uow: 'IUnitOfWork' = unit_of_work

    def execute(self, videogame_id: int, name: str, icon: UploadFile | None, rank_per_role: bool) -> VideogameObjectResponse:
        with self.uow as uow:
            existing_game = CatalogValidationService.get_and_validate_exist_videogame(videogame_id, uow)
            cleaned_name = name.strip() if name else existing_game.name
            self.validate_name_uniqueness(cleaned_name, videogame_id, uow=uow)

            # actualizar juego
            existing_game.name = cleaned_name
            existing_game.rank_per_role = rank_per_role

            new_icon_url = None
            if icon and icon.filename:
                game_folder = SlugService.to_slug(cleaned_name)
                new_icon_url = self.storage_service.save_image_file(
                    file_content=icon.file,
                    filename=icon.filename,
                    subfolder=f"games/{game_folder}",
                    preserve_original_name=True
                )
                old_icon_url = existing_game.icon_url
                existing_game.icon_url = new_icon_url
            else:
                old_icon_url = None

            try:
                updated_game = uow.videogame_repo.update_videogame(existing_game)
            except Exception as e:
                if new_icon_url:
                    self.storage_service.delete_file(new_icon_url)
                raise e

            if old_icon_url:
                try:
                    self.storage_service.delete_file(old_icon_url)
                except Exception as e:
                    print(f"Error al borrar la imagen vieja: {old_icon_url}")

        return VideogameObjectResponse(
            id=cast(int, updated_game.videogame_id),
            name=updated_game.name,
            icon_url=updated_game.icon_url or "Sin icono",
            rank_per_role=updated_game.rank_per_role,
        )

    # Validar que el nombre no exista en la base de datos
    @staticmethod
    def validate_name_uniqueness(cleaned_name: str, current_game_id: int, uow: 'IUnitOfWork') -> bool:
        found_videogame = uow.videogame_repo.get_videogame_by_name(cleaned_name.lower())
        if found_videogame and found_videogame.videogame_id != current_game_id:
            raise VideogameAlreadyExistsException(cleaned_name)
        return True



