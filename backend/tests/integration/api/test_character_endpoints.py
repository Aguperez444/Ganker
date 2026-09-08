import io
import pytest


class TestCharacterEndpointsIntegration:

    # ---------------------------------------------------------
    # POST /api/v1/characters/
    # ---------------------------------------------------------

    def test_register_character_success(self, client, player_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("tracer.png", io.BytesIO(b"fake-character-icon"), "image/png")
        data = {
            "name": "Tracer",
            "videogame_id": vg_id
        }

        response = client.post(
            "/api/v1/characters/",
            data=data,
            files={"icon": file},
            headers=player_auth_headers
        )

        assert response.status_code == 201
        res_data = response.json()
        assert res_data["name"] == "Tracer"
        assert "character_id" in res_data
        assert res_data["icon_url"].startswith("/media/games/")

    def test_register_character_videogame_not_found(self, client, player_auth_headers):
        file = ("char.png", io.BytesIO(b"data"), "image/png")
        data = {
            "name": "Ghost",
            "videogame_id": 99999
        }

        response = client.post(
            "/api/v1/characters/",
            data=data,
            files={"icon": file},
            headers=player_auth_headers
        )

        assert response.status_code == 404

    def test_register_character_duplicate_name(self, client, player_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        existing_char_name = seed_catalog_data["characters"][0].name
        file = ("char.png", io.BytesIO(b"data"), "image/png")
        data = {
            "name": existing_char_name,
            "videogame_id": vg_id
        }

        response = client.post(
            "/api/v1/characters/",
            data=data,
            files={"icon": file},
            headers=player_auth_headers
        )

        assert response.status_code == 400
        assert "already exists" in response.json().get("error", "").lower()

    def test_register_character_invalid_name(self, client, player_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("char.png", io.BytesIO(b"data"), "image/png")
        data = {
            "name": "  ",
            "videogame_id": vg_id
        }

        response = client.post(
            "/api/v1/characters/",
            data=data,
            files={"icon": file},
            headers=player_auth_headers
        )

        assert response.status_code == 400

    def test_register_character_unauthorized(self, client, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("char.png", io.BytesIO(b"data"), "image/png")
        data = {"name": "UnauthorizedChar", "videogame_id": vg_id}

        response = client.post("/api/v1/characters/", data=data, files={"icon": file})
        assert response.status_code == 401

    # ---------------------------------------------------------
    # PUT /api/v1/characters/{character_id}
    # ---------------------------------------------------------

    def test_update_character_success(self, client, player_auth_headers, seed_catalog_data):
        char_id = seed_catalog_data["characters"][0].character_id
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("new_icon.png", io.BytesIO(b"new-icon-data"), "image/png")
        data = {
            "name": "Updated Character Name",
            "videogame_id": vg_id
        }

        response = client.put(
            f"/api/v1/characters/{char_id}",
            data=data,
            files={"icon": file},
            headers=player_auth_headers
        )

        assert response.status_code == 200
        res_data = response.json()
        assert res_data["character_id"] == char_id
        assert res_data["name"] == "Updated Character Name"
        assert res_data["icon_url"].startswith("/media/games/")

    def test_update_character_not_found(self, client, player_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("icon.png", io.BytesIO(b"data"), "image/png")
        data = {
            "name": "Whatever",
            "videogame_id": vg_id
        }

        response = client.put(
            "/api/v1/characters/99999",
            data=data,
            files={"icon": file},
            headers=player_auth_headers
        )

        assert response.status_code == 404

    def test_update_character_duplicate_name_conflict(self, client, player_auth_headers, seed_catalog_data):
        char_to_update = seed_catalog_data["characters"][0]
        other_char = seed_catalog_data["characters"][1]
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("icon.png", io.BytesIO(b"data"), "image/png")

        data = {
            "name": other_char.name,
            "videogame_id": vg_id
        }

        response = client.put(
            f"/api/v1/characters/{char_to_update.character_id}",
            data=data,
            files={"icon": file},
            headers=player_auth_headers
        )

        assert response.status_code == 400

    def test_update_character_missing_icon(self, client, player_auth_headers, seed_catalog_data):
        char_id = seed_catalog_data["characters"][0].character_id
        vg_id = seed_catalog_data["videogame"].videogame_id
        data = {"name": "NoIcon", "videogame_id": vg_id}

        response = client.put(
            f"/api/v1/characters/{char_id}",
            data=data,
            headers=player_auth_headers
        )
        assert response.status_code == 422

    def test_update_character_unauthorized(self, client, seed_catalog_data):
        char_id = seed_catalog_data["characters"][0].character_id
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("icon.png", io.BytesIO(b"data"), "image/png")
        data = {"name": "NoAuth", "videogame_id": vg_id}

        response = client.put(f"/api/v1/characters/{char_id}", data=data, files={"icon": file})
        assert response.status_code == 401

    # ---------------------------------------------------------
    # GET /api/v1/characters/{videogame_id} (Admin only)
    # ---------------------------------------------------------

    def test_get_characters_by_videogame_id_admin_success(self, client, admin_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id

        response = client.get(f"/api/v1/characters/{vg_id}", headers=admin_auth_headers)

        assert response.status_code == 200
        res_data = response.json()
        assert "characters" in res_data
        assert len(res_data["characters"]) >= 3

    def test_get_characters_forbidden_for_player(self, client, player_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id

        response = client.get(f"/api/v1/characters/{vg_id}", headers=player_auth_headers)
        assert response.status_code == 403

    def test_get_characters_unauthorized(self, client, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id

        response = client.get(f"/api/v1/characters/{vg_id}")
        assert response.status_code == 401
