from urllib.parse import parse_qs, urlparse

import pytest

import app.infrastructure.api.controllers.user_controller as user_ctrl_module
from app.application.ports.i_discord_oauth_provider import IDiscordOAuthProvider
from app.domain.exceptions.discord.discord_authorization_failed_exception import DiscordAuthorizationFailedException
from app.domain.models.discord_account_link import DiscordAccount
from app.infrastructure.database.models.discord_account_link_orm import DiscordAccountLinkORM


class FakeDiscordOAuth(IDiscordOAuthProvider):
    """Reemplaza a Discord: el código "bueno" corresponde a la cuenta de Ana."""

    def authorization_url(self, state: str) -> str:
        return f"https://discord.com/oauth2/authorize?client_id=test&state={state}"

    def exchange_code(self, code: str) -> DiscordAccount:
        if code != "bueno":
            raise DiscordAuthorizationFailedException()
        return DiscordAccount(discord_user_id="555", username="ana_gamer", global_name="Ana", avatar_url=None)


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
