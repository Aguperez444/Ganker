from typing import TYPE_CHECKING, Optional

import httpx

from app.application.ports.i_character_catalog_provider import ICharacterCatalogProvider
from app.application.ports.i_character_catalog_provider_resolver import ICharacterCatalogProviderResolver
from app.domain.services.slug_service import SlugService
from app.infrastructure.catalog_providers.riot_data_dragon_provider import RiotDataDragonProvider
from app.infrastructure.config.settings import settings

if TYPE_CHECKING:
    from app.domain.models.videogame import Videogame


# Un único cliente HTTP compartido (igual que el engine de la base): reutiliza las conexiones
# al descargar los íconos en lugar de abrir una nueva por cada personaje
http_client = httpx.Client(timeout=settings.external_catalog_timeout_seconds, follow_redirects=True)


def _default_providers() -> dict[str, ICharacterCatalogProvider]:
    # Clave: slug del nombre del videojuego. Los juegos que no figuran acá se cargan manualmente.
    # Para sumar un juego con API (ej. Valorant), se agrega su adaptador en esta carpeta y su entrada acá.
    return {
        "league_of_legends": RiotDataDragonProvider(http_client),
    }


class CharacterCatalogProviderResolverImpl(ICharacterCatalogProviderResolver):
    def __init__(self, providers_by_game_slug: dict[str, ICharacterCatalogProvider] | None = None):
        self.providers_by_game_slug: dict[str, ICharacterCatalogProvider] = (
            providers_by_game_slug if providers_by_game_slug is not None else _default_providers()
        )

    def get_provider_for(self, videogame: 'Videogame') -> Optional[ICharacterCatalogProvider]:
        return self.providers_by_game_slug.get(SlugService.to_slug(videogame.name))
