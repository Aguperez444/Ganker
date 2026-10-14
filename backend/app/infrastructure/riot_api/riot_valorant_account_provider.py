from typing import Optional
from urllib.parse import quote

from app.application.ports.i_riot_game_provider import IRiotGameProvider
from app.domain.exceptions.riot.riot_account_not_found_exception import RiotAccountNotFoundException
from app.domain.exceptions.riot.riot_account_without_game_exception import RiotAccountWithoutGameException
from app.domain.exceptions.riot.riot_api_unavailable_exception import RiotApiUnavailableException
from app.domain.models.riot_account import RiotAccount
from app.infrastructure.riot_api.riot_api_client import RiotApiClient

# account-v1 responde lo mismo desde cualquier región; se usa una fija
ACCOUNT_ROUTING = "americas"


class RiotValorantAccountProvider(IRiotGameProvider):
    """
    Cuentas de Valorant desde la API oficial de Riot Games.

    Solo se puede confirmar que la cuenta existe y en qué región juega (account-v1 y su "active shard").
    Las partidas y el rango (val-match-v1) Riot los habilita únicamente a aplicaciones de producción con
    Riot Sign On: con una clave de desarrollo o personal responden 403, así que no hay estadísticas.
    """

    def __init__(self, riot_api: RiotApiClient):
        self.riot_api: RiotApiClient = riot_api

    @property
    def requires_server(self) -> bool:
        return False

    @property
    def provides_stats(self) -> bool:
        return False

    def find_account(self, game_name: str, tag_line: str, server: Optional[str] = None) -> tuple[RiotAccount, str]:
        riot_id = f"{game_name}#{tag_line}"
        data = self.riot_api.get(
            ACCOUNT_ROUTING,
            f"/riot/account/v1/accounts/by-riot-id/{quote(game_name)}/{quote(tag_line)}",
            on_not_found=lambda: RiotAccountNotFoundException(riot_id),
        )
        try:
            account = RiotAccount(puuid=data["puuid"], game_name=data["gameName"], tag_line=data["tagLine"])
        except (KeyError, TypeError):
            raise RiotApiUnavailableException()

        # Región donde juega Valorant ("latam", "na", "br", "eu", "ap", "kr"); 404 si nunca jugó
        shard = self.riot_api.get(
            ACCOUNT_ROUTING,
            f"/riot/account/v1/active-shards/by-game/val/by-puuid/{quote(account.puuid)}",
            on_not_found=lambda: RiotAccountWithoutGameException(account.riot_id, "Valorant"),
        )
        try:
            return account, shard["activeShard"]
        except (KeyError, TypeError):
            raise RiotApiUnavailableException()

    def fetch_stats(self, account: RiotAccount, server: str) -> None:
        return None
