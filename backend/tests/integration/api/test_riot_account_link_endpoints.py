from datetime import datetime

import pytest

import app.infrastructure.api.controllers.game_profile_controller as gp_ctrl_module
from app.application.ports.i_riot_game_provider import IRiotGameProvider
from app.domain.exceptions.riot.riot_account_not_found_exception import RiotAccountNotFoundException
from app.domain.models.lol_stats import LolChampionMastery, LolMatch, LolRankedEntry, LolStats
from app.domain.models.riot_account import RiotAccount
from app.infrastructure.riot_api.riot_game_provider_resolver_impl import RiotGameProviderResolverImpl
from app.infrastructure.database.models.game_profile_orm import GameProfileORM
from app.infrastructure.database.models.riot_account_link_orm import RiotAccountLinkORM
from app.infrastructure.database.models.videogame_orm import VideogameORM


class FakeLolStatsProvider(IRiotGameProvider):
    """Reemplaza a la API de Riot para que los tests no dependan de internet ni de una clave."""

    def __init__(self):
        self.tier = "Diamond"  # Igual al nombre de un rango de seed_catalog_data
        self.fetch_count = 0

    @property
    def requires_server(self) -> bool:
        return True

    @property
    def provides_stats(self) -> bool:
        return True

    def find_account(self, game_name, tag_line, server):
        if game_name == "Nadie":
            raise RiotAccountNotFoundException(f"{game_name}#{tag_line}", server)
        return RiotAccount(puuid=f"puuid-{game_name}", game_name=game_name, tag_line=tag_line), server

    def fetch_stats(self, account, server):
        self.fetch_count += 1
        return LolStats(
            summoner_level=300,
            profile_icon_url="https://ddragon/profileicon/1.png",
            ranked=[LolRankedEntry("RANKED_SOLO_5x5", "Solo/Dúo", self.tier, "IV", 10, 20, 10)],
            top_masteries=[LolChampionMastery("Ahri", None, 10, 90000)],
            matches=[LolMatch("LA2_1", "Ahri", None, 8, 2, 6, True, "Mid", 200, 1700, "Solo/Dúo",
                              datetime(2026, 10, 13, 22, 0))],
        )


class FakeValorantProvider(IRiotGameProvider):
    """Como la API real de Valorant: confirma la cuenta e informa la región, sin estadísticas."""

    @property
    def requires_server(self) -> bool:
        return False

    @property
    def provides_stats(self) -> bool:
        return False

    def find_account(self, game_name, tag_line, server):
        return RiotAccount(puuid=f"puuid-{game_name}", game_name=game_name, tag_line=tag_line), "latam"

    def fetch_stats(self, account, server):
        return None


@pytest.fixture
def fake_riot(monkeypatch):
    provider = FakeLolStatsProvider()
    resolver = RiotGameProviderResolverImpl({"league_of_legends": provider, "valorant": FakeValorantProvider()})
    monkeypatch.setattr(gp_ctrl_module, "get_riot_provider_resolver", lambda: resolver)
    return provider


@pytest.fixture
def valorant_profile_id(seed_player, test_db_session):
    """Perfil de Valorant del jugador (cargado directo en la base: el seed no trae roles ni rangos de Valorant)."""
    valorant = VideogameORM(name="Valorant", icon_url="/val.png", rank_per_role=False)
    test_db_session.add(valorant)
    test_db_session.flush()
    profile = GameProfileORM(player_id=seed_player.user_id, videogame_id=valorant.videogame_id)
    test_db_session.add(profile)
    test_db_session.commit()
    return profile.game_profile_id


@pytest.fixture
def lol_profile_id(client, player_auth_headers, seed_catalog_data):
    """Perfil de LoL del jugador, con rango Gold."""
    payload = {
        "videogame_id": seed_catalog_data["videogame"].videogame_id,
        "character_ids": [seed_catalog_data["characters"][0].character_id],
        "roles": [{"role_id": seed_catalog_data["roles"][0].role_id, "rank_id": seed_catalog_data["ranks"][0].rank_id}],
    }
    response = client.post("/api/v1/game_profiles/", json=payload, headers=player_auth_headers)
    assert response.status_code == 201
    return response.json()["profile_id"]


class TestRiotAccountLinkEndpoints:

    def test_profile_without_link(self, client, player_auth_headers, lol_profile_id, fake_riot):
        response = client.get(f"/api/v1/game_profiles/{lol_profile_id}/riot", headers=player_auth_headers)

        assert response.status_code == 200
        assert response.json()["supported"] is True
        assert response.json()["linked"] is False

    def test_link_saves_stats_and_replaces_rank(self, client, player_auth_headers, lol_profile_id, fake_riot,
                                                test_db_session):
        response = client.post(f"/api/v1/game_profiles/{lol_profile_id}/riot",
                               json={"riot_id": "Ana#LAS", "server": "la2"}, headers=player_auth_headers)

        assert response.status_code == 200
        body = response.json()
        assert body["riot_id"] == "Ana#LAS"
        assert body["server"] == "la2"
        assert body["rank_sync"]["status"] == "updated"
        assert body["rank_sync"]["rank_name"] == "Diamond"
        assert body["stats"]["recent"]["kda"] == 7.0
        assert body["stats"]["matches"][0]["champion_name"] == "Ahri"

        me = client.get("/api/v1/users/me", headers=player_auth_headers).json()
        assert me["profiles"][0]["role_profiles"][0]["rank"]["name"] == "Diamond"

        stored = test_db_session.query(RiotAccountLinkORM).filter_by(game_profile_id=lol_profile_id).one()
        assert stored.puuid == "puuid-Ana"
        assert stored.stats["summoner_level"] == 300

    def test_other_players_see_saved_stats(self, client, player_auth_headers, admin_auth_headers, lol_profile_id,
                                           fake_riot):
        client.post(f"/api/v1/game_profiles/{lol_profile_id}/riot", json={"riot_id": "Ana#LAS", "server": "la2"},
                    headers=player_auth_headers)

        response = client.get(f"/api/v1/game_profiles/{lol_profile_id}/riot", headers=admin_auth_headers)

        assert response.status_code == 200
        assert response.json()["stats"]["summoner_level"] == 300
        assert fake_riot.fetch_count == 1  # Ver las estadísticas no vuelve a consultar a Riot

    def test_cannot_link_profile_of_another_player(self, client, admin_auth_headers, lol_profile_id, fake_riot):
        response = client.post(f"/api/v1/game_profiles/{lol_profile_id}/riot",
                               json={"riot_id": "Ana#LAS", "server": "la2"}, headers=admin_auth_headers)
        # Mismo criterio que editar un perfil ajeno (DoesNotBelongToProfileException)
        assert response.status_code == 400
        assert fake_riot.fetch_count == 0

    def test_invalid_riot_id(self, client, player_auth_headers, lol_profile_id, fake_riot):
        response = client.post(f"/api/v1/game_profiles/{lol_profile_id}/riot",
                               json={"riot_id": "SinTag", "server": "la2"}, headers=player_auth_headers)
        assert response.status_code == 400

    def test_lol_requires_server(self, client, player_auth_headers, lol_profile_id, monkeypatch):
        # Con el adaptador real de LoL (sin consultar a Riot): el servidor es obligatorio y tiene que existir
        from app.infrastructure.riot_api.riot_api_client import RiotApiClient
        from app.infrastructure.riot_api.riot_lol_stats_provider import RiotLolStatsProvider
        resolver = RiotGameProviderResolverImpl({"league_of_legends": RiotLolStatsProvider(RiotApiClient(None))})
        monkeypatch.setattr(gp_ctrl_module, "get_riot_provider_resolver", lambda: resolver)

        for body in ({"riot_id": "Ana#LAS"}, {"riot_id": "Ana#LAS", "server": "marte"}):
            response = client.post(f"/api/v1/game_profiles/{lol_profile_id}/riot", json=body,
                                   headers=player_auth_headers)
            assert response.status_code == 400
            assert "servidor" in response.json()["error"]

    def test_account_not_found(self, client, player_auth_headers, lol_profile_id, fake_riot):
        response = client.post(f"/api/v1/game_profiles/{lol_profile_id}/riot",
                               json={"riot_id": "Nadie#LAS", "server": "la2"}, headers=player_auth_headers)
        assert response.status_code == 404
        assert "Nadie#LAS" in response.json()["error"]

    def test_refresh_too_soon_after_linking(self, client, player_auth_headers, lol_profile_id, fake_riot):
        client.post(f"/api/v1/game_profiles/{lol_profile_id}/riot", json={"riot_id": "Ana#LAS", "server": "la2"},
                    headers=player_auth_headers)

        response = client.post(f"/api/v1/game_profiles/{lol_profile_id}/riot/refresh", headers=player_auth_headers)

        assert response.status_code == 429
        assert fake_riot.fetch_count == 1

    def test_refresh_after_cooldown(self, client, player_auth_headers, lol_profile_id, fake_riot, monkeypatch):
        from datetime import timedelta
        monkeypatch.setattr(gp_ctrl_module, "get_riot_refresh_cooldown", lambda: timedelta(0))
        client.post(f"/api/v1/game_profiles/{lol_profile_id}/riot", json={"riot_id": "Ana#LAS", "server": "la2"},
                    headers=player_auth_headers)
        fake_riot.tier = "Platinum"

        response = client.post(f"/api/v1/game_profiles/{lol_profile_id}/riot/refresh", headers=player_auth_headers)

        assert response.status_code == 200
        assert response.json()["rank_sync"]["rank_name"] == "Platinum"
        assert fake_riot.fetch_count == 2

    def test_unlink(self, client, player_auth_headers, lol_profile_id, fake_riot):
        client.post(f"/api/v1/game_profiles/{lol_profile_id}/riot", json={"riot_id": "Ana#LAS", "server": "la2"},
                    headers=player_auth_headers)

        response = client.delete(f"/api/v1/game_profiles/{lol_profile_id}/riot", headers=player_auth_headers)
        assert response.status_code == 200

        after = client.get(f"/api/v1/game_profiles/{lol_profile_id}/riot", headers=player_auth_headers).json()
        assert after["linked"] is False
        # El rango del perfil queda como lo dejó Riot
        me = client.get("/api/v1/users/me", headers=player_auth_headers).json()
        assert me["profiles"][0]["role_profiles"][0]["rank"]["name"] == "Diamond"

    def test_link_valorant_saves_region_without_stats(self, client, player_auth_headers, valorant_profile_id,
                                                      fake_riot):
        before = client.get(f"/api/v1/game_profiles/{valorant_profile_id}/riot", headers=player_auth_headers).json()
        assert (before["supported"], before["requires_server"], before["provides_stats"]) == (True, False, False)

        response = client.post(f"/api/v1/game_profiles/{valorant_profile_id}/riot", json={"riot_id": "Ana#LAS"},
                               headers=player_auth_headers)

        assert response.status_code == 200
        body = response.json()
        assert (body["linked"], body["riot_id"], body["server"]) == (True, "Ana#LAS", "latam")
        assert (body["stats"], body["rank_sync"]) == (None, None)
        refresh = client.post(f"/api/v1/game_profiles/{valorant_profile_id}/riot/refresh", headers=player_auth_headers)
        assert refresh.status_code == 400

    def test_same_account_in_lol_and_valorant(self, client, player_auth_headers, lol_profile_id, valorant_profile_id,
                                              fake_riot):
        lol = client.post(f"/api/v1/game_profiles/{lol_profile_id}/riot", json={"riot_id": "Ana#LAS", "server": "la2"},
                          headers=player_auth_headers)
        valorant = client.post(f"/api/v1/game_profiles/{valorant_profile_id}/riot", json={"riot_id": "Ana#LAS"},
                               headers=player_auth_headers)

        assert (lol.status_code, valorant.status_code) == (200, 200)

    def test_link_not_supported_for_games_without_riot(self, client, player_auth_headers, seed_player,
                                                       test_db_session, fake_riot):
        overwatch = VideogameORM(name="Overwatch", icon_url="/ow.png", rank_per_role=True)
        test_db_session.add(overwatch)
        test_db_session.flush()
        overwatch_profile = GameProfileORM(player_id=seed_player.user_id, videogame_id=overwatch.videogame_id)
        test_db_session.add(overwatch_profile)
        test_db_session.commit()
        profile_id = overwatch_profile.game_profile_id

        assert client.get(f"/api/v1/game_profiles/{profile_id}/riot",
                          headers=player_auth_headers).json()["supported"] is False
        response = client.post(f"/api/v1/game_profiles/{profile_id}/riot", json={"riot_id": "Ana#LAS", "server": "la2"},
                               headers=player_auth_headers)
        assert response.status_code == 400

    def test_requires_login(self, client, lol_profile_id):
        assert client.get(f"/api/v1/game_profiles/{lol_profile_id}/riot").status_code == 401
