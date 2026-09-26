from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.file.file_name_not_null_exception import FileNameNotNullException
from app.domain.models.character import Character
from app.domain.exceptions.file.file_not_null_exception import FileNotNullException
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.services.static_validation_service import StaticValidationService
from app.domain.services.slug_service import SlugService
from app.infrastructure.api.dto.response.base_classes.character_object_response import CharacterObjectResponse

from typing import cast




class CreateCharacter:
    def __init__(self, storage_service: IStorageService, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work
        self.storage_service: IStorageService = storage_service

    def execute(self, name: str, videogame_id: int, icon_file, icon_filename) -> CharacterObjectResponse:
        cleaned_name = StaticValidationService.validate_character_name_format(name)

        with self.uow as uow:
            game = CatalogValidationService.get_and_validate_exist_videogame(videogame_id, uow)
            CatalogValidationService.validate_new_character_name_uniqueness(cleaned_name, videogame_id, uow=uow)

            if not icon_file:
                raise FileNotNullException()
            if icon_file and not icon_filename:
                raise FileNameNotNullException()

            game_folder = SlugService.to_slug(game.name)

            icon_url = self.storage_service.save_image_file(
                file_content=icon_file,
                filename=icon_filename,
                subfolder=f"games/{game_folder}/characters",
                preserve_original_name=True
            )

            new_character = Character(
                character_id=None,
                name=cleaned_name,
                videogame=game,
                icon_url=icon_url
            )

            try:
                saved_character = uow.character_repo.create_character(new_character)
            except Exception as e:
                if icon_url:
                    self.storage_service.delete_file(icon_url)
                raise e

        return CharacterObjectResponse(
            character_id=cast(int, saved_character.character_id),
            name=saved_character.name,
            icon_url=saved_character.icon_url or "Sin icono"
        )



