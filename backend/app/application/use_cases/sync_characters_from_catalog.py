from app.application.ports.i_character_catalog_provider_resolver import ICharacterCatalogProviderResolver
from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.character.character_sync_not_supported_exception import CharacterSyncNotSupportedException
from app.domain.exceptions.domain_exception import DomainException
from app.domain.models.character import Character
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.services.slug_service import SlugService
from app.infrastructure.api.dto.response.base_classes.character_object_response import CharacterObjectResponse
from app.infrastructure.api.dto.response.create_register.sync_characters_response import SyncCharactersResponse


class SyncCharactersFromCatalog:
    """
    Importa los personajes de un videojuego desde su catálogo externo (ej. la API de Riot Games).
    Solo agrega los que faltan: los que ya existen (mismo nombre) no se tocan, y nunca se borra ninguno,
    para no afectar a los jugadores que los tienen entre sus preferidos.
    """

    def __init__(self, provider_resolver: ICharacterCatalogProviderResolver, storage_service: IStorageService,
                 uow: IUnitOfWork):
        self.provider_resolver: ICharacterCatalogProviderResolver = provider_resolver
        self.storage_service: IStorageService = storage_service
        self.uow: IUnitOfWork = uow

    def execute(self, videogame_id: int) -> SyncCharactersResponse:
        with self.uow as uow:
            videogame = CatalogValidationService.get_and_validate_exist_videogame(videogame_id, uow)

            provider = self.provider_resolver.get_provider_for(videogame)
            if provider is None or not videogame.has_characters:
                raise CharacterSyncNotSupportedException(videogame.name)

            catalog = provider.fetch_characters()
            game_folder = SlugService.to_slug(videogame.name)

            created: list[Character] = []
            failed: list[str] = []
            skipped_count = 0
            saved_icon_urls: list[str] = []

            try:
                for catalog_character in catalog:
                    name = catalog_character.name.strip() if catalog_character.name else ""
                    if not name:
                        continue

                    if uow.character_repo.get_character_by_name_and_videogame(name, videogame_id):
                        skipped_count += 1
                        continue

                    # Si falla un ícono puntual se sigue con el resto: el admin ve cuáles fallaron
                    # y puede volver a sincronizar o cargarlos a mano
                    try:
                        icon_file, icon_filename = provider.download_icon(catalog_character)
                        icon_url = self.storage_service.save_image_file(
                            file_content=icon_file,
                            filename=icon_filename,
                            subfolder=f"games/{game_folder}/characters",
                            preserve_original_name=True
                        )
                    except DomainException:
                        failed.append(name)
                        continue

                    saved_icon_urls.append(icon_url)
                    created.append(uow.character_repo.create_character(
                        Character(character_id=None, name=name, videogame=videogame, icon_url=icon_url)
                    ))
            except Exception as e:
                # La UoW hace rollback de los personajes; acá se limpian los íconos que ya se guardaron
                self._delete_icons(saved_icon_urls)
                raise e

        return SyncCharactersResponse(
            source=provider.source_name,
            created=[CharacterObjectResponse(character_id=character.character_id, name=character.name,
                                             icon_url=character.icon_url or "Sin icono") for character in created],
            skipped_count=skipped_count,
            failed=failed
        )

    def _delete_icons(self, icon_urls: list[str]) -> None:
        for icon_url in icon_urls:
            # noinspection broad-exception
            try:
                self.storage_service.delete_file(icon_url)
            except Exception:
                from colorama import Fore, Style
                print(Fore.RED + "-" * 70 + "\n" + f"Error inesperado al borrar el ícono importado: {icon_url} \n" + "-" * 70 + "\n" + Style.RESET_ALL)
