from datetime import datetime
from typing import Optional
from urllib.parse import quote

import httpx

from app.application.ports.i_riot_game_provider import IRiotGameProvider
from app.domain.exceptions.riot.riot_account_not_found_exception import RiotAccountNotFoundException
from app.domain.exceptions.riot.riot_api_unavailable_exception import RiotApiUnavailableException
from app.domain.exceptions.riot.riot_server_required_exception import RiotServerRequiredException
from app.domain.models.lol_server import LolServer
from app.domain.models.lol_stats import LolChampionMastery, LolMatch, LolRankedEntry, LolStats
from app.domain.models.riot_account import RiotAccount
from app.infrastructure.config.settings import settings
from app.infrastructure.riot_api.riot_api_client import RiotApiClient

# Las cuentas y las partidas se consultan por región ("routing value"); el resto, por servidor.
# https://developer.riotgames.com/docs/lol#routing-values
REGIONAL_ROUTING = { # esto es un diccionario que mapea LolServer a routing value, ej: LolServer.LAS -> "americas"
    LolServer.LAS: "americas", LolServer.LAN: "americas", LolServer.BR: "americas", LolServer.NA: "americas",
    LolServer.EUW: "europe", LolServer.EUNE: "europe", LolServer.TR: "europe", LolServer.RU: "europe",
    LolServer.ME: "europe",
    LolServer.KR: "asia", LolServer.JP: "asia",
    LolServer.OCE: "sea", LolServer.SEA: "sea", LolServer.TW: "sea", LolServer.VN: "sea",
}

# Nombres en español, iguales a los que carga el admin como rangos (así se puede reemplazar el rango del perfil)
TIERS = {
    "IRON": "Hierro", "BRONZE": "Bronce", "SILVER": "Plata", "GOLD": "Oro", "PLATINUM": "Platino",
    "EMERALD": "Esmeralda", "DIAMOND": "Diamante", "MASTER": "Maestro", "GRANDMASTER": "Gran Maestro",
    "CHALLENGER": "Retador",
}
APEX_TIERS = {"MASTER", "GRANDMASTER", "CHALLENGER"}  # No tienen división

RANKED_QUEUE_TYPES = {"RANKED_SOLO_5x5": "Solo/Dúo", "RANKED_FLEX_SR": "Flexible"}

# https://static.developer.riotgames.com/docs/lol/queues.json
QUEUES = {
    420: "Solo/Dúo", 440: "Flexible", 400: "Normal", 430: "Normal", 490: "Partida rápida", 450: "ARAM",
    700: "Clash", 720: "ARAM Clash", 900: "ARURF", 1700: "Arena", 1710: "Arena", 1740: "Arena", 1900: "URF",
}
# Si la cola es nueva y todavía no figura arriba, se nombra por el modo de juego
GAME_MODES = {"CLASSIC": "Normal", "ARAM": "ARAM", "CHERRY": "Arena", "URF": "URF", "ONEFORALL": "Uno para todos",
              "NEXUSBLITZ": "Nexus Blitz", "ULTBOOK": "Libro de definitivas"}

POSITIONS = {"TOP": "Top", "JUNGLE": "Jungla", "MIDDLE": "Mid", "BOTTOM": "ADC", "UTILITY": "Support"}

MASTERY_TOP_COUNT = 5

# Campeones de Data Dragon por versión: {version: {champion_key: (id, nombre)}}. Se piden una vez por parche.
_champions_cache: dict[str, dict[int, tuple[str, str]]] = {}


class RiotLolStatsProvider(IRiotGameProvider):
    """
    Cuentas y estadísticas de League of Legends desde la API oficial de Riot Games.
    Doc: https://developer.riotgames.com/apis (account-v1, summoner-v4, league-v4, champion-mastery-v4, match-v5)
    """

    def __init__(self, riot_api: RiotApiClient, match_count: int | None = None,
                 ddragon_base_url: str | None = None, locale: str | None = None):
        self.riot_api: RiotApiClient = riot_api
        self.match_count: int = match_count if match_count is not None else settings.riot_match_history_count
        self.ddragon_base_url: str = (ddragon_base_url or settings.riot_ddragon_base_url).rstrip("/")
        self.locale: str = locale or settings.riot_ddragon_locale

    @property
    def requires_server(self) -> bool:
        return True

    @property
    def provides_stats(self) -> bool:
        return True

    def find_account(self, game_name: str, tag_line: str, server: Optional[str]) -> tuple[RiotAccount, str]:
        # convierte el str que representa al servidor un un objeto de nuestro Enum del dominio (ej: "LAS" -> LolServer.LAS)
        lol_server = self._lol_server(server)
        # busca el perfil de Riot por su Riot ID (game_name#tag_line) en la API de Riot, usando el routing value de la región
        # si no lo encuentra, lanza RiotAccountNotFoundException; si la API no responde, lanza RiotApiUnavailableException
        data = self.riot_api.get(
            REGIONAL_ROUTING[lol_server],
            f"/riot/account/v1/accounts/by-riot-id/{quote(game_name)}/{quote(tag_line)}",
            on_not_found=lambda: RiotAccountNotFoundException(f"{game_name}#{tag_line}", lol_server.name),
        )
        try:
            account = RiotAccount(puuid=data["puuid"], game_name=data["gameName"], tag_line=data["tagLine"])
        except (KeyError, TypeError):
            raise RiotApiUnavailableException()
        return account, lol_server.value

    def fetch_stats(self, account: RiotAccount, server: str) -> LolStats:
        lol_server = self._lol_server(server)
        platform, regional = lol_server.value, REGIONAL_ROUTING[lol_server]
        version, champions = self._champions()
        puuid = quote(account.puuid)

        summoner = self.riot_api.get(platform, f"/lol/summoner/v4/summoners/by-puuid/{puuid}")
        entries = self.riot_api.get(platform, f"/lol/league/v4/entries/by-puuid/{puuid}")
        masteries = self.riot_api.get(
            platform, f"/lol/champion-mastery/v4/champion-masteries/by-puuid/{puuid}/top?count={MASTERY_TOP_COUNT}"
        )
        match_ids = self.riot_api.get(
            regional, f"/lol/match/v5/matches/by-puuid/{puuid}/ids?start=0&count={self.match_count}"
        )
        matches = [self.riot_api.get(regional, f"/lol/match/v5/matches/{quote(match_id)}") for match_id in match_ids]

        try:
            return LolStats(
                summoner_level=summoner["summonerLevel"],
                profile_icon_url=f"{self.ddragon_base_url}/cdn/{version}/img/profileicon/{summoner['profileIconId']}.png",
                ranked=[self._ranked_entry(entry) for entry in entries if entry.get("queueType") in RANKED_QUEUE_TYPES],
                top_masteries=[self._mastery(mastery, version, champions) for mastery in masteries],
                matches=[parsed for match in matches
                         if (parsed := self._match(match, account.puuid, version, champions)) is not None],
            )
        except (KeyError, TypeError, ValueError):
            raise RiotApiUnavailableException()

    @staticmethod
    def _lol_server(server: Optional[str]) -> LolServer:
        try:
            return LolServer(server)
        except ValueError:
            raise RiotServerRequiredException("League of Legends")

    # ---------------------------------------------------------
    # Traducción de las respuestas de Riot al dominio
    # ---------------------------------------------------------

    @staticmethod
    def _ranked_entry(entry: dict) -> LolRankedEntry:
        tier = entry["tier"]
        return LolRankedEntry(
            queue_type=entry["queueType"],
            queue=RANKED_QUEUE_TYPES[entry["queueType"]],
            tier=TIERS.get(tier, tier.capitalize()),
            division=None if tier in APEX_TIERS else entry.get("rank"),
            league_points=entry.get("leaguePoints", 0),
            wins=entry.get("wins", 0),
            losses=entry.get("losses", 0),
        )

    def _mastery(self, mastery: dict, version: str, champions: dict[int, tuple[str, str]]) -> LolChampionMastery:
        champion_id, champion_name = champions.get(mastery["championId"], (None, f"Campeón {mastery['championId']}"))
        return LolChampionMastery(
            champion_name=champion_name,
            icon_url=self._champion_icon(version, champion_id),
            level=mastery.get("championLevel", 0),
            points=mastery.get("championPoints", 0),
        )

    def _match(self, match: dict, puuid: str, version: str,
               champions: dict[int, tuple[str, str]]) -> Optional[LolMatch]:
        info = match["info"]
        participant = next((p for p in info["participants"] if p.get("puuid") == puuid), None)
        if participant is None:
            return None

        champion_id, champion_name = champions.get(
            participant["championId"], (participant.get("championName"), participant.get("championName", "?"))
        )
        timestamp = info.get("gameEndTimestamp") or info["gameStartTimestamp"]
        return LolMatch(
            match_id=match["metadata"]["matchId"],
            champion_name=champion_name,
            champion_icon_url=self._champion_icon(version, champion_id),
            kills=participant["kills"],
            deaths=participant["deaths"],
            assists=participant["assists"],
            win=bool(participant["win"]),
            role=POSITIONS.get(participant.get("teamPosition") or ""),
            cs=participant.get("totalMinionsKilled", 0) + participant.get("neutralMinionsKilled", 0),
            duration_seconds=info["gameDuration"],
            queue=QUEUES.get(info.get("queueId")) or GAME_MODES.get(info.get("gameMode"), "Otro modo"),
            played_at=datetime.fromtimestamp(timestamp / 1000),
        )

    def _champion_icon(self, version: str, champion_id: Optional[str]) -> Optional[str]:
        return f"{self.ddragon_base_url}/cdn/{version}/img/champion/{champion_id}.png" if champion_id else None

    # ---------------------------------------------------------
    # Data Dragon (nombres e íconos de campeones)
    # ---------------------------------------------------------

    def _champions(self) -> tuple[str, dict[int, tuple[str, str]]]:
        """Versión actual de Data Dragon y sus campeones por key numérica: {266: ("Aatrox", "Aatrox")}."""
        try:
            # Data Dragon es público: no lleva la clave de Riot
            # busca las versiones o parches públicados
            versions = self.riot_api.http_client.get(f"{self.ddragon_base_url}/api/versions.json")
            versions.raise_for_status()
            # guarda el parche más reciente (el número digamos ej 13.1.1)
            version = versions.json()[0]

            # si ese parche no está en nuestro caché, pedimos todos los campeones de ese parche
            # y los guardamos en caché para no pedirlos otra vez
            if version not in _champions_cache:
                response = self.riot_api.http_client.get(
                    f"{self.ddragon_base_url}/cdn/{version}/data/{self.locale}/champion.json"
                )

                response.raise_for_status()
                _champions_cache[version] = {
                    int(champion["key"]): (champion["id"], champion["name"])
                    for champion in response.json()["data"].values()
                }

            return version, _champions_cache[version]
        except (httpx.HTTPError, ValueError, KeyError, IndexError, TypeError):
            raise RiotApiUnavailableException()
