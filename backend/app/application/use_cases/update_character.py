from typing import TYPE_CHECKING, cast

from app.application.ports.i_storage_service import IStorageService

from app.infrastructure.api.dto.response.base_classes.character_object_response import CharacterObjectResponse

from app.domain.services.slug_service import SlugService
from app.domain.services.static_validation_service import StaticValidationService
from app.domain.services.catalog_validation_service import CatalogValidationService

if TYPE_CHECKING:
    from app.application.ports.i_unit_of_work import IUnitOfWork


class UpdateCharacter:
    def __init__(self, storage_service: IStorageService, uow: 'IUnitOfWork'):
        self.storage_service: IStorageService = storage_service
        self.uow: 'IUnitOfWork' = uow

    def execute(self, character_id: int, name: str, videogame_id: int, icon) -> CharacterObjectResponse:
        # Validar que el nombre no esté vacío
        StaticValidationService.validate_character_name_format(name)

        cleaned_name = name.strip()

        with self.uow as uow:
            videogame = CatalogValidationService.get_and_validate_exist_videogame(videogame_id, uow)
            CatalogValidationService.validate_character_name_uniqueness(character_id, cleaned_name, videogame_id, uow=uow)

            character = CatalogValidationService.get_and_validate_exist_character(character_id, uow)

            new_icon_url = None
            if icon and icon.filename:
                game_folder = SlugService.to_slug(videogame.name)
                new_icon_url = self.storage_service.save_image_file(
                    file_content=icon.file,
                    filename=icon.filename,
                    subfolder=f"games/{game_folder}/characters",
                    preserve_original_name=True
                )
                old_icon_url = character.icon_url
                character.icon_url = new_icon_url
            else:
                old_icon_url = None

            character.name = cleaned_name
            character.videogame = videogame

            try:
                updated_character = uow.character_repo.update_character(character)
            except Exception as e:
                if new_icon_url:
                    self.storage_service.delete_file(new_icon_url)
                raise e

            if old_icon_url:
                try:
                    self.storage_service.delete_file(old_icon_url)
                except Exception:
                    # Si hay un error al borrar la imagen anterior, se informa por consola, pero no se lanza una excepción
                    # porque el usuario ya fue actualizado correctamente y no quiero que eso afecte la respuesta al cliente
                    from colorama import Fore, Style
                    print(Fore.RED + "-" * 70 + "\n" + f"Error inesperado al borrar la imagen anterior del usuario: {old_icon_url} \n" + "-" * 70 + "\n" + Style.RESET_ALL)

        return CharacterObjectResponse(
            character_id=cast(int, updated_character.character_id),
            name=updated_character.name,
            icon_url=updated_character.icon_url or "Sin icono",
        )

