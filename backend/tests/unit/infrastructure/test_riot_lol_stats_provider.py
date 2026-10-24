from datetime import datetime, timezone

import httpx
import pytest

import app.infrastructure.riot_api.riot_lol_stats_provider as provider_module
from app.domain.exceptions.riot.riot_account_not_found_exception import RiotAccountNotFoundException
from app.domain.exceptions.riot.riot_account_without_game_exception import RiotAccountWithoutGameException
from app.domain.exceptions.riot.riot_api_unavailable_exception import RiotApiUnavailableException
from app.domain.exceptions.riot.riot_server_required_exception import RiotServerRequiredException
from app.domain.models.riot_account import RiotAccount
from app.domain.models.riot_account_link import RiotAccountLink
from app.domain.models.videogame import Videogame
from app.infrastructure.database.mappers.riot_account_link_mapper import RiotAccountLinkMapper
from app.infrastructure.riot_api.riot_api_client import RiotApiClient
from app.infrastructure.riot_api.riot_game_provider_resolver_impl import RiotGameProviderResolverImpl
from app.infrastructure.riot_api.riot_lol_stats_provider import RiotLolStatsProvider
from app.infrastructure.riot_api.riot_valorant_account_provider import RiotValorantAccountProvider

PUUID = "puuid-ana"
ACCOUNT = RiotAccount(puuid=PUUID, game_name="Ana", tag_line="LAS")
GAME_END_MS = 1_760_000_000_000


def _participant(puuid, champion_id, champion_name, kills, deaths, assists, win, position):
    return {"puuid": puuid, "championId": champion_id, "championName": champion_name, "kills": kills,
            "deaths": deaths, "assists": assists, "win": win, "teamPosition": position,
            "totalMinionsKilled": 150, "neutralMinionsKilled": 12}


RIOT_RESPONSES = {
    ("americas", f"/riot/account/v1/accounts/by-riot-id/Ana/LAS"): {"puuid": PUUID, "gameName": "Ana", "tagLine": "LAS"},
    ("la2", f"/lol/summoner/v4/summoners/by-puuid/{PUUID}"): {"puuid": PUUID, "profileIconId": 588, "summonerLevel": 245},
    ("la2", f"/lol/league/v4/entries/by-puuid/{PUUID}"): [
        {"queueType": "RANKED_FLEX_SR", "tier": "MASTER", "rank": "I", "leaguePoints": 12, "wins": 40, "losses": 30},
        {"queueType": "RANKED_SOLO_5x5", "tier": "GOLD", "rank": "II", "leaguePoints": 45, "wins": 60, "losses": 55},
        {"queueType": "CHERRY", "tier": "", "rank": "", "leaguePoints": 0, "wins": 1, "losses": 1},
    ],
    ("la2", f"/lol/champion-mastery/v4/champion-masteries/by-puuid/{PUUID}/top"): [
        {"championId": 103, "championLevel": 12, "championPoints": 150000},
        {"championId": 62, "championLevel": 7, "championPoints": 60000},
    ],
    ("americas", f"/lol/match/v5/matches/by-puuid/{PUUID}/ids"): ["LA2_1", "LA2_2", "LA2_3"],
    ("americas", "/lol/match/v5/matches/LA2_1"): {
        "metadata": {"matchId": "LA2_1"},
        "info": {"gameEndTimestamp": GAME_END_MS, "gameStartTimestamp": GAME_END_MS - 1_800_000,
                 "gameDuration": 1800, "queueId": 420,
                 "participants": [_participant("otro", 1, "Annie", 0, 0, 0, False, "TOP"),
                                  _participant(PUUID, 62, "MonkeyKing", 7, 3, 9, True, "JUNGLE")]},
    },
    ("americas", "/lol/match/v5/matches/LA2_2"): {
        "metadata": {"matchId": "LA2_2"},
        "info": {"gameStartTimestamp": GAME_END_MS, "gameDuration": 1200, "queueId": 450,
                 "participants": [_participant(PUUID, 103, "Ahri", 12, 8, 20, False, "")]},
    },
    # Cola que todavía no está en QUEUES: se nombra por el modo de juego
    ("americas", "/lol/match/v5/matches/LA2_3"): {
        "metadata": {"matchId": "LA2_3"},
        "info": {"gameStartTimestamp": GAME_END_MS, "gameDuration": 900, "queueId": 9999, "gameMode": "CHERRY",
                 "participants": [_participant(PUUID, 103, "Ahri", 4, 2, 3, True, "")]},
    },
}

CHAMPIONS = {"data": {
    "Ahri": {"id": "Ahri", "key": "103", "name": "Ahri"},
    "MonkeyKing": {"id": "MonkeyKing", "key": "62", "name": "Wukong"},
}}


def _handler(riot_responses=RIOT_RESPONSES, status_by_path=None):
    def handle(request: httpx.Request) -> httpx.Response:
        host = request.url.host.split(".")[0]
        if host == "ddragon":
            if request.url.path == "/api/versions.json":
                return httpx.Response(200, json=["16.20.1"])
            return httpx.Response(200, json=CHAMPIONS)

        assert request.headers["X-Riot-Token"] == "clave-de-prueba"
        for (expected_host, path), status in (status_by_path or {}).items():
            if host == expected_host and request.url.path == path:
                return httpx.Response(status)
        body = riot_responses.get((host, request.url.path))
        return httpx.Response(200, json=body) if body is not None else httpx.Response(404)
    return handle


def _riot_api(handler=None, api_key="clave-de-prueba") -> RiotApiClient:
    client = httpx.Client(transport=httpx.MockTransport(handler or _handler()))
    return RiotApiClient(client, api_key=api_key, api_host_template="https://{host}.riot.test")


def _provider(handler=None, api_key="clave-de-prueba") -> RiotLolStatsProvider:
    return RiotLolStatsProvider(_riot_api(handler, api_key), match_count=3, ddragon_base_url="https://ddragon.test",
                                locale="es_AR")


@pytest.fixture(autouse=True)
def clear_champions_cache():
    provider_module._champions_cache.clear()


class TestRiotLolStatsProvider:

    def test_requires_server_and_provides_stats(self):
        provider = _provider()
        assert provider.requires_server is True
        assert provider.provides_stats is True

    def test_find_account(self):
        assert _provider().find_account("Ana", "LAS", "la2") == (ACCOUNT, "la2")

    @pytest.mark.parametrize("server", [None, "", "marte"])
    def test_find_account_without_valid_server(self, server):
        with pytest.raises(RiotServerRequiredException) as exc_info:
            _provider().find_account("Ana", "LAS", server)
        assert exc_info.value.status_code == 400

    def test_find_account_not_found(self):
        with pytest.raises(RiotAccountNotFoundException) as exc_info:
            _provider().find_account("Nadie", "LAS", "la2")
        assert exc_info.value.status_code == 404
        assert "Nadie#LAS" in exc_info.value.message

    def test_fetch_stats_translates_riot_data(self):
        stats = _provider().fetch_stats(ACCOUNT, "la2")

        assert stats.summoner_level == 245
        assert stats.profile_icon_url == "https://ddragon.test/cdn/16.20.1/img/profileicon/588.png"

        # Solo las colas clasificatorias de la Grieta, con la liga en español; Maestro no tiene división
        assert [(e.queue, e.tier, e.division) for e in stats.ranked] == [("Flexible", "Maestro", None),
                                                                        ("Solo/Dúo", "Oro", "II")]

        assert [(m.champion_name, m.level) for m in stats.top_masteries] == [("Ahri", 12), ("Wukong", 7)]
        assert stats.top_masteries[1].icon_url == "https://ddragon.test/cdn/16.20.1/img/champion/MonkeyKing.png"

        first, second, third = stats.matches
        assert (first.champion_name, first.kills, first.deaths, first.assists, first.win) == ("Wukong", 7, 3, 9, True)
        assert (first.role, first.cs, first.queue, first.duration_seconds) == ("Jungla", 162, "Solo/Dúo", 1800)
        assert first.played_at == datetime.fromtimestamp(GAME_END_MS / 1000, tz=timezone.utc)
        assert first.played_at.utcoffset().total_seconds() == 0
        assert (second.role, second.queue) == (None, "ARAM")
        assert third.queue == "Arena"

    def test_without_api_key(self):
        with pytest.raises(RiotApiUnavailableException) as exc_info:
            _provider(api_key="").find_account("Ana", "LAS", "la2")
        assert exc_info.value.status_code == 503
        assert "RIOT_API_KEY" in exc_info.value.message

    @pytest.mark.parametrize("status, text", [(401, "no es válida o venció"), (403, "no es válida o venció"),
                                              (429, "limitando")])
    def test_key_and_rate_limit_errors(self, status, text):
        path = ("americas", "/riot/account/v1/accounts/by-riot-id/Ana/LAS")
        with pytest.raises(RiotApiUnavailableException) as exc_info:
            _provider(_handler(status_by_path={path: status})).find_account("Ana", "LAS", "la2")
        assert exc_info.value.status_code == 503
        assert text in exc_info.value.message

    def test_server_error_while_fetching_stats(self):
        path = ("la2", f"/lol/league/v4/entries/by-puuid/{PUUID}")
        with pytest.raises(RiotApiUnavailableException) as exc_info:
            _provider(_handler(status_by_path={path: 500})).fetch_stats(ACCOUNT, "la2")
        assert exc_info.value.status_code == 502

    def test_network_error(self):
        def handler(request):
            raise httpx.ConnectError("sin conexión", request=request)
        with pytest.raises(RiotApiUnavailableException):
            _provider(handler).find_account("Ana", "LAS", "la2")

    def test_unexpected_payload(self):
        broken = {**RIOT_RESPONSES, ("la2", f"/lol/summoner/v4/summoners/by-puuid/{PUUID}"): {"puuid": PUUID}}
        with pytest.raises(RiotApiUnavailableException):
            _provider(_handler(riot_responses=broken)).fetch_stats(ACCOUNT, "la2")


class TestRiotAccountLinkMapper:

    def test_stats_survive_json_round_trip(self):
        stats = _provider().fetch_stats(ACCOUNT, "la2")
        link = RiotAccountLink(link_id=3, game_profile_id=10, account=ACCOUNT, server="la2", stats=stats,
                               last_synced_at=datetime(2026, 10, 14, 12, 0))

        orm = RiotAccountLinkMapper.domain_to_orm(link)
        restored = RiotAccountLinkMapper.orm_to_domain(orm)

        assert isinstance(orm.stats["matches"][0]["played_at"], str)
        assert restored.stats == stats
        assert restored.server == "la2"
        assert restored.account == ACCOUNT
        assert RiotAccountLinkMapper.stats_from_json(None) is None


VALORANT_RESPONSES = {
    ("americas", "/riot/account/v1/accounts/by-riot-id/Ana/LAS"): {"puuid": PUUID, "gameName": "Ana", "tagLine": "LAS"},
    ("americas", f"/riot/account/v1/active-shards/by-game/val/by-puuid/{PUUID}"):
        {"puuid": PUUID, "game": "val", "activeShard": "latam"},
}


class TestRiotValorantAccountProvider:

    def _provider(self, responses=VALORANT_RESPONSES):
        return RiotValorantAccountProvider(_riot_api(_handler(riot_responses=responses)))

    def test_does_not_require_server_nor_provide_stats(self):
        provider = self._provider()
        assert provider.requires_server is False
        assert provider.provides_stats is False
        assert provider.fetch_stats(ACCOUNT, "latam") is None

    def test_find_account_returns_valorant_region(self):
        assert self._provider().find_account("Ana", "LAS") == (ACCOUNT, "latam")

    def test_account_not_found(self):
        with pytest.raises(RiotAccountNotFoundException) as exc_info:
            self._provider().find_account("Nadie", "LAS")
        assert exc_info.value.message == "No se encontró la cuenta de Riot 'Nadie#LAS'."

    def test_account_that_never_played_valorant(self):
        only_account = {k: v for k, v in VALORANT_RESPONSES.items() if "active-shards" not in k[1]}
        with pytest.raises(RiotAccountWithoutGameException) as exc_info:
            self._provider(only_account).find_account("Ana", "LAS")
        assert exc_info.value.status_code == 404
        assert "Valorant" in exc_info.value.message


class TestRiotGameProviderResolverImpl:

    def test_each_riot_game_gets_its_provider(self):
        resolver = RiotGameProviderResolverImpl()
        assert isinstance(resolver.get_provider_for(Videogame(1, "League of Legends", "", False)), RiotLolStatsProvider)
        assert isinstance(resolver.get_provider_for(Videogame(2, "Valorant", "", False)), RiotValorantAccountProvider)

    @pytest.mark.parametrize("game_name", ["Overwatch", "CS2"])
    def test_other_games_do_not_support_riot_accounts(self, game_name):
        assert RiotGameProviderResolverImpl().get_provider_for(Videogame(3, game_name, "", False)) is None

