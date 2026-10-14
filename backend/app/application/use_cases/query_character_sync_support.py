from app.application.ports.i_character_catalog_provider_resolver import ICharacterCatalogProviderResolver
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.infrastructure.api.dto.response.get.get_character_sync_support_response import GetCharacterSyncSupportResponse


class QueryCharacterSyncSupport:
    def __init__(self, provider_resolver: ICharacterCatalogProviderResolver, uow: IUnitOfWork):
        self.provider_resolver: ICharacterCatalogProviderResolver = provider_resolver
        self.uow: IUnitOfWork = uow

    def execute(self, videogame_id: int) -> GetCharacterSyncSupportResponse:
        with self.uow as uow:
            videogame = CatalogValidationService.get_and_validate_exist_videogame(videogame_id, uow)

        provider = self.provider_resolver.get_provider_for(videogame)
        if provider is None or not videogame.has_characters:
            return GetCharacterSyncSupportResponse(supported=False, source=None)

        return GetCharacterSyncSupportResponse(supported=True, source=provider.source_name)
