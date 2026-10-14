from typing import TYPE_CHECKING, Optional

from app.application.ports.i_riot_game_provider import IRiotGameProvider
from app.application.ports.i_riot_game_provider_resolver import IRiotGameProviderResolver
from app.domain.services.slug_service import SlugService
from app.infrastructure.riot_api.riot_api_client import RiotApiClient, riot_http_client
from app.infrastructure.riot_api.riot_lol_stats_provider import RiotLolStatsProvider
from app.infrastructure.riot_api.riot_valorant_account_provider import RiotValorantAccountProvider

if TYPE_CHECKING:
    from app.domain.models.videogame import Videogame


def _default_providers() -> dict[str, IRiotGameProvider]:
    # Clave: slug del nombre del videojuego. Los juegos que no figuran acá no admiten vincular cuenta de Riot.
    riot_api = RiotApiClient(riot_http_client)
    return {
        "league_of_legends": RiotLolStatsProvider(riot_api),
        "valorant": RiotValorantAccountProvider(riot_api),
    }


class RiotGameProviderResolverImpl(IRiotGameProviderResolver):
    def __init__(self, providers_by_game_slug: dict[str, IRiotGameProvider] | None = None):
        self.providers_by_game_slug: dict[str, IRiotGameProvider] = (
            providers_by_game_slug if providers_by_game_slug is not None else _default_providers()
        )

    def get_provider_for(self, videogame: 'Videogame') -> Optional[IRiotGameProvider]:
        return self.providers_by_game_slug.get(SlugService.to_slug(videogame.name))
