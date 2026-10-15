import httpx
import pytest

from app.domain.exceptions.character.external_catalog_unavailable_exception import ExternalCatalogUnavailableException
from app.infrastructure.api.dto.request.catalog_character import CatalogCharacter
from app.domain.models.videogame import Videogame
from app.infrastructure.catalog_providers.riot_data_dragon_provider import RiotDataDragonProvider
from app.infrastructure.catalog_providers.character_catalog_provider_resolver_impl import CharacterCatalogProviderResolverImpl


BASE_URL = "https://ddragon.test"

CHAMPIONS_JSON = {
    "type": "champion",
    "version": "16.20.1",
    "data": {
        "Ahri": {"id": "Ahri", "name": "Ahri", "image": {"full": "Ahri.png"}},
        "MonkeyKing": {"id": "MonkeyKing", "name": "Wukong", "image": {"full": "MonkeyKing.png"}},
    },
}


def _provider(handler) -> RiotDataDragonProvider:
    client = httpx.Client(transport=httpx.MockTransport(handler))
    return RiotDataDragonProvider(client, base_url=BASE_URL, locale="es_AR")


def _happy_handler(request: httpx.Request) -> httpx.Response:
    if request.url.path == "/api/versions.json":
        return httpx.Response(200, json=["16.20.1", "16.19.1"])
    if request.url.path == "/cdn/16.20.1/data/es_AR/champion.json":
        return httpx.Response(200, json=CHAMPIONS_JSON)
    if request.url.path.startswith("/cdn/16.20.1/img/champion/"):
        return httpx.Response(200, content=b"\x89PNG-bytes")
    return httpx.Response(404)


class TestRiotDataDragonProvider:

    def test_fetch_characters_uses_latest_version_and_locale(self):
        provider = _provider(_happy_handler)

        characters = provider.fetch_characters()

        assert [c.name for c in characters] == ["Ahri", "Wukong"]
        assert characters[1].icon_source == f"{BASE_URL}/cdn/16.20.1/img/champion/MonkeyKing.png"

    def test_download_icon_names_file_after_visible_name(self):
        provider = _provider(_happy_handler)
        wukong = CatalogCharacter(name="Wukong", icon_source=f"{BASE_URL}/cdn/16.20.1/img/champion/MonkeyKing.png")

        content, filename = provider.download_icon(wukong)

        assert filename == "Wukong.png"
        assert content.read() == b"\x89PNG-bytes"

    def test_versions_endpoint_down_raises_unavailable(self):
        provider = _provider(lambda request: httpx.Response(503))

        with pytest.raises(ExternalCatalogUnavailableException) as exc_info:
            provider.fetch_characters()

        assert exc_info.value.status_code == 502

    def test_network_error_raises_unavailable(self):
        def handler(request):
            raise httpx.ConnectError("sin conexión", request=request)

        with pytest.raises(ExternalCatalogUnavailableException):
            _provider(handler).fetch_characters()

    def test_empty_versions_raises_unavailable(self):
        provider = _provider(lambda request: httpx.Response(200, json=[]))

        with pytest.raises(ExternalCatalogUnavailableException):
            provider.fetch_characters()

    def test_unexpected_champion_format_raises_unavailable(self):
        def handler(request):
            if request.url.path == "/api/versions.json":
                return httpx.Response(200, json=["16.20.1"])
            return httpx.Response(200, json={"data": {"Ahri": {"name": "Ahri"}}})

        with pytest.raises(ExternalCatalogUnavailableException):
            _provider(handler).fetch_characters()

    def test_invalid_json_raises_unavailable(self):
        provider = _provider(lambda request: httpx.Response(200, content=b"<html>no es json</html>"))

        with pytest.raises(ExternalCatalogUnavailableException):
            provider.fetch_characters()

    def test_download_icon_not_found_raises_unavailable(self):
        provider = _provider(lambda request: httpx.Response(404))

        with pytest.raises(ExternalCatalogUnavailableException):
            provider.download_icon(CatalogCharacter(name="Ahri", icon_source=f"{BASE_URL}/cdn/x/img/champion/Ahri.png"))


class TestCharacterCatalogProviderResolverImpl:

    def test_league_of_legends_uses_riot_data_dragon(self):
        resolver = CharacterCatalogProviderResolverImpl()
        lol = Videogame(videogame_id=1, name="League of Legends", icon_url="/lol.png", rank_per_role=False)

        assert isinstance(resolver.get_provider_for(lol), RiotDataDragonProvider)

    @pytest.mark.parametrize("game_name", ["Valorant", "Overwatch", "CS2"])
    def test_other_games_are_loaded_manually(self, game_name):
        resolver = CharacterCatalogProviderResolverImpl()
        game = Videogame(videogame_id=2, name=game_name, icon_url="/icon.png", rank_per_role=False)

        assert resolver.get_provider_for(game) is None
