import io
import pytest
from tests.conftest import VALID_PNG_BYTES

import app.infrastructure.api.controllers.character_controller as char_ctrl_module
from app.application.ports.i_character_catalog_provider import ICharacterCatalogProvider
from app.domain.exceptions.character.external_catalog_unavailable_exception import ExternalCatalogUnavailableException
from app.domain.models.catalog_character import CatalogCharacter
from app.infrastructure.catalog_providers.character_catalog_provider_resolver_impl import CharacterCatalogProviderResolverImpl
from app.infrastructure.database.models.character_orm import CharacterORM
from app.infrastructure.database.models.videogame_orm import VideogameORM


class FakeCatalogProvider(ICharacterCatalogProvider):
    """Reemplaza a la API de Riot para que los tests no dependan de internet."""

    def __init__(self, characters: list[CatalogCharacter], available: bool = True):
        self.characters = characters
        self.available = available

    @property
    def source_name(self) -> str:
        return "Catálogo de prueba"

    def fetch_characters(self) -> list[CatalogCharacter]:
        if not self.available:
            raise ExternalCatalogUnavailableException(self.source_name)
        return self.characters

    def download_icon(self, character: CatalogCharacter):
        return io.BytesIO(VALID_PNG_BYTES), f"{character.name}.png"


@pytest.fixture
def fake_provider(monkeypatch):
    provider = FakeCatalogProvider([
        CatalogCharacter(name="Ahri", icon_source="fake://ahri"),       # ya existe en seed_catalog_data
        CatalogCharacter(name="Wukong", icon_source="fake://wukong"),
        CatalogCharacter(name="Nunu y Willump", icon_source="fake://nunu"),
    ])
    monkeypatch.setattr(
        char_ctrl_module, "get_catalog_provider_resolver",
        lambda: CharacterCatalogProviderResolverImpl({"league_of_legends": provider})
    )
    return provider


class TestCharacterSyncEndpointsIntegration:

    # ---------------------------------------------------------
    # GET /api/v1/characters/sync/{videogame_id}
    # ---------------------------------------------------------

    def test_sync_support_for_game_with_catalog(self, client, admin_auth_headers, seed_catalog_data, fake_provider):
        vg_id = seed_catalog_data["videogame"].videogame_id

        response = client.get(f"/api/v1/characters/sync/{vg_id}", headers=admin_auth_headers)

        assert response.status_code == 200
        assert response.json() == {"supported": True, "source": "Catálogo de prueba"}

    def test_sync_support_for_manual_game(self, client, admin_auth_headers, test_db_session, fake_provider):
        overwatch = VideogameORM(name="Overwatch", icon_url="/ow.png", rank_per_role=True)
        test_db_session.add(overwatch)
        test_db_session.commit()

        response = client.get(f"/api/v1/characters/sync/{overwatch.videogame_id}", headers=admin_auth_headers)

        assert response.status_code == 200
        assert response.json() == {"supported": False, "source": None}

    def test_sync_support_requires_admin(self, client, player_auth_headers, seed_catalog_data, fake_provider):
        vg_id = seed_catalog_data["videogame"].videogame_id

        response = client.get(f"/api/v1/characters/sync/{vg_id}", headers=player_auth_headers)

        assert response.status_code == 403

    # ---------------------------------------------------------
    # POST /api/v1/characters/sync/{videogame_id}
    # ---------------------------------------------------------

    def test_sync_creates_missing_characters_and_saves_icons(self, client, admin_auth_headers, seed_catalog_data,
                                                             fake_provider, test_db_session):
        vg_id = seed_catalog_data["videogame"].videogame_id

        response = client.post(f"/api/v1/characters/sync/{vg_id}", headers=admin_auth_headers)

        assert response.status_code == 200
        body = response.json()
        assert body["source"] == "Catálogo de prueba"
        assert sorted(c["name"] for c in body["created"]) == ["Nunu y Willump", "Wukong"]
        assert body["skipped_count"] == 1
        assert body["failed"] == []

        names = {c.name for c in test_db_session.query(CharacterORM).filter_by(videogame_id=vg_id).all()}
        assert names == {"Ahri", "Yasuo", "Jinx", "Wukong", "Nunu y Willump"}

        wukong = next(c for c in body["created"] if c["name"] == "Wukong")
        assert wukong["icon_url"] == "/media/games/league_of_legends/characters/wukong.png"
        assert client.get(wukong["icon_url"]).status_code == 200

    def test_sync_twice_does_not_duplicate(self, client, admin_auth_headers, seed_catalog_data, fake_provider):
        vg_id = seed_catalog_data["videogame"].videogame_id
        client.post(f"/api/v1/characters/sync/{vg_id}", headers=admin_auth_headers)

        response = client.post(f"/api/v1/characters/sync/{vg_id}", headers=admin_auth_headers)

        assert response.status_code == 200
        assert response.json()["created"] == []
        assert response.json()["skipped_count"] == 3

    def test_sync_manual_game_returns_400(self, client, admin_auth_headers, test_db_session, fake_provider):
        valorant = VideogameORM(name="Valorant", icon_url="/val.png", rank_per_role=False)
        test_db_session.add(valorant)
        test_db_session.commit()

        response = client.post(f"/api/v1/characters/sync/{valorant.videogame_id}", headers=admin_auth_headers)

        assert response.status_code == 400
        assert "manualmente" in response.json()["error"]

    def test_sync_videogame_not_found(self, client, admin_auth_headers, fake_provider):
        response = client.post("/api/v1/characters/sync/99999", headers=admin_auth_headers)

        assert response.status_code == 404

    def test_sync_catalog_unavailable_returns_502(self, client, admin_auth_headers, seed_catalog_data, fake_provider):
        fake_provider.available = False
        vg_id = seed_catalog_data["videogame"].videogame_id

        response = client.post(f"/api/v1/characters/sync/{vg_id}", headers=admin_auth_headers)

        assert response.status_code == 502

    def test_sync_requires_admin(self, client, player_auth_headers, seed_catalog_data, fake_provider):
        vg_id = seed_catalog_data["videogame"].videogame_id

        response = client.post(f"/api/v1/characters/sync/{vg_id}", headers=player_auth_headers)

        assert response.status_code == 403

    def test_manual_registration_still_works_for_synced_game(self, client, admin_auth_headers, seed_catalog_data,
                                                             fake_provider):
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("custom.png", io.BytesIO(VALID_PNG_BYTES), "image/png")

        response = client.post("/api/v1/characters/", data={"name": "Campeón nuevo", "videogame_id": vg_id},
                               files={"icon": file}, headers=admin_auth_headers)

        assert response.status_code == 201
