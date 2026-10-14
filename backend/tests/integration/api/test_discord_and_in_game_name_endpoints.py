from urllib.parse import parse_qs, urlparse

import pytest

import app.infrastructure.api.controllers.game_profile_controller as gp_ctrl_module
import app.infrastructure.api.controllers.user_controller as user_ctrl_module
from app.application.ports.i_discord_oauth_provider import IDiscordOAuthProvider
from app.application.ports.i_riot_game_provider import IRiotGameProvider
from app.domain.exceptions.discord.discord_authorization_failed_exception import DiscordAuthorizationFailedException
from app.domain.models.discord_account_link import DiscordAccount
from app.domain.models.riot_account import RiotAccount
from app.infrastructure.database.models.discord_account_link_orm import DiscordAccountLinkORM
from app.infrastructure.riot_api.riot_game_provider_resolver_impl import RiotGameProviderResolverImpl


class FakeDiscordOAuth(IDiscordOAuthProvider):
    """Reemplaza a Discord: el código "bueno" corresponde a la cuenta de Ana."""

    def authorization_url(self, state: str) -> str:
        return f"https://discord.com/oauth2/authorize?client_id=test&state={state}"

    def exchange_code(self, code: str) -> DiscordAccount:
        if code != "bueno":
            raise DiscordAuthorizationFailedException()
        return DiscordAccount(discord_user_id="555", username="ana_gamer", global_name="Ana", avatar_url=None)


class FakeValorantProvider(IRiotGameProvider):
    @property
    def requires_server(self) -> bool:
        return False

    @property
    def provides_stats(self) -> bool:
        return False

    def find_account(self, game_name, tag_line, server):
        return RiotAccount(puuid="puuid-ana", game_name=game_name, tag_line=tag_line), "latam"

    def fetch_stats(self, account, server):
        return None


@pytest.fixture
def fake_discord(monkeypatch):
    monkeypatch.setattr(user_ctrl_module, "get_discord_oauth_provider", lambda: FakeDiscordOAuth())


def _state(client, headers) -> str:
    response = client.get("/api/v1/users/me/discord/authorize", headers=headers)
    assert response.status_code == 200
    return parse_qs(urlparse(response.json()["authorization_url"]).query)["state"][0]


class TestDiscordEndpoints:

    def test_full_link_flow(self, client, player_auth_headers, seed_player, fake_discord, test_db_session):
        state = _state(client, player_auth_headers)

        response = client.post("/api/v1/users/me/discord", json={"code": "bueno", "state": state},
                               headers=player_auth_headers)

        assert response.status_code == 200
        body = response.json()
        assert (body["linked"], body["username"], body["display_name"]) == (True, "ana_gamer", "Ana")
        assert body["profile_url"] == "https://discord.com/users/555"
        assert body["visibility"] == "teammates"
        stored = test_db_session.query(DiscordAccountLinkORM).filter_by(user_id=seed_player.user_id).one()
        assert stored.discord_user_id == "555"

        own = client.get(f"/api/v1/users/{seed_player.user_id}/discord", headers=player_auth_headers).json()
        assert own["linked"] is True
        mine = client.get("/api/v1/users/me/discord", headers=player_auth_headers).json()
        assert (mine["linked"], mine["visibility"]) == (True, "teammates")

    def test_state_of_another_user_is_rejected(self, client, player_auth_headers, admin_auth_headers, fake_discord):
        state_of_admin = _state(client, admin_auth_headers)

        response = client.post("/api/v1/users/me/discord", json={"code": "bueno", "state": state_of_admin},
                               headers=player_auth_headers)

        assert response.status_code == 400

    def test_invalid_code(self, client, player_auth_headers, fake_discord):
        state = _state(client, player_auth_headers)
        response = client.post("/api/v1/users/me/discord", json={"code": "malo", "state": state},
                               headers=player_auth_headers)
        assert response.status_code == 400

    def test_visibility_for_other_players(self, client, player_auth_headers, admin_auth_headers, seed_player,
                                          fake_discord):
        state = _state(client, player_auth_headers)
        client.post("/api/v1/users/me/discord", json={"code": "bueno", "state": state}, headers=player_auth_headers)
        url = f"/api/v1/users/{seed_player.user_id}/discord"

        # Solo compañeros de equipo (por defecto): otro jugador sin equipo en común no la ve
        hidden = client.get(url, headers=admin_auth_headers).json()
        assert (hidden["linked"], hidden["username"]) == (False, None)

        changed = client.put("/api/v1/users/me/discord/visibility", json={"visibility": "everyone"},
                             headers=player_auth_headers)
        assert changed.status_code == 200

        visible = client.get(url, headers=admin_auth_headers).json()
        assert (visible["linked"], visible["username"], visible["visibility"]) == (True, "ana_gamer", None)

    def test_unlink(self, client, player_auth_headers, seed_player, fake_discord):
        state = _state(client, player_auth_headers)
        client.post("/api/v1/users/me/discord", json={"code": "bueno", "state": state}, headers=player_auth_headers)

        assert client.delete("/api/v1/users/me/discord", headers=player_auth_headers).status_code == 200
        assert client.delete("/api/v1/users/me/discord", headers=player_auth_headers).status_code == 404
        assert client.get(f"/api/v1/users/{seed_player.user_id}/discord",
                          headers=player_auth_headers).json()["linked"] is False

    def test_requires_login(self, client, seed_player):
        assert client.get("/api/v1/users/me/discord/authorize").status_code == 401
        assert client.get(f"/api/v1/users/{seed_player.user_id}/discord").status_code == 401


@pytest.fixture
def lol_profile_payload(seed_catalog_data):
    return {
        "videogame_id": seed_catalog_data["videogame"].videogame_id,
        "character_ids": [seed_catalog_data["characters"][0].character_id],
        "roles": [{"role_id": seed_catalog_data["roles"][0].role_id, "rank_id": seed_catalog_data["ranks"][0].rank_id}],
    }


class TestInGameNameEndpoints:

    def test_create_and_update_in_game_name(self, client, player_auth_headers, seed_player, lol_profile_payload):
        created = client.post("/api/v1/game_profiles/", json={**lol_profile_payload, "in_game_name": "  AnaMain  "},
                              headers=player_auth_headers)
        assert created.status_code == 201
        profile_id = created.json()["profile_id"]

        profile = client.get(f"/api/v1/users/{seed_player.user_id}/profile", headers=player_auth_headers).json()
        assert profile["profiles"][0]["in_game_name"] == "AnaMain"

        update_body = {"character_ids": lol_profile_payload["character_ids"],
                       "roles_ranks": lol_profile_payload["roles"], "in_game_name": "AnaSupport"}
        updated = client.put(f"/api/v1/game_profiles/{profile_id}", json=update_body, headers=player_auth_headers)
        assert updated.status_code == 200
        assert updated.json()["in_game_name"] == "AnaSupport"

        cleared = client.put(f"/api/v1/game_profiles/{profile_id}", json={**update_body, "in_game_name": ""},
                             headers=player_auth_headers)
        assert cleared.json()["in_game_name"] is None

    def test_in_game_name_too_long(self, client, player_auth_headers, lol_profile_payload):
        response = client.post("/api/v1/game_profiles/", json={**lol_profile_payload, "in_game_name": "x" * 51},
                               headers=player_auth_headers)
        assert response.status_code == 422

    def test_riot_link_sets_and_locks_in_game_name(self, client, player_auth_headers, lol_profile_payload,
                                                   monkeypatch):
        # El perfil del seed es de "League of Legends"; se le asigna el adaptador de prueba para no consultar a Riot
        resolver = RiotGameProviderResolverImpl({"league_of_legends": FakeValorantProvider()})
        monkeypatch.setattr(gp_ctrl_module, "get_riot_provider_resolver", lambda: resolver)
        profile_id = client.post("/api/v1/game_profiles/", json={**lol_profile_payload, "in_game_name": "Manual"},
                                 headers=player_auth_headers).json()["profile_id"]

        linked = client.post(f"/api/v1/game_profiles/{profile_id}/riot", json={"riot_id": "Ana#LAS"},
                             headers=player_auth_headers)
        assert linked.status_code == 200

        update_body = {"character_ids": lol_profile_payload["character_ids"],
                       "roles_ranks": lol_profile_payload["roles"], "in_game_name": "Otro nombre"}
        updated = client.put(f"/api/v1/game_profiles/{profile_id}", json=update_body, headers=player_auth_headers)
        assert updated.json()["in_game_name"] == "Ana#LAS"
