import io
import pytest


class TestVideogameEndpointsIntegration:

    # ---------------------------------------------------------
    # POST /api/v1/videogames/
    # ---------------------------------------------------------

    def test_register_videogame_success(self, client, admin_auth_headers):
        file = ("game_icon.png", io.BytesIO(b"fake-game-icon-data"), "image/png")
        data = {"name": "Overwatch 2"}

        response = client.post(
            "/api/v1/videogames/",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )

        assert response.status_code == 201
        res_data = response.json()
        assert res_data["name"] == "Overwatch 2"
        assert "id" in res_data
        assert res_data["icon_url"].startswith("/media/games/")

    def test_register_videogame_forbidden_for_player(self, client, player_auth_headers):
        file = ("game_icon.png", io.BytesIO(b"data"), "image/png")
        data = {"name": "Apex Legends"}

        response = client.post(
            "/api/v1/videogames/",
            data=data,
            files={"icon": file},
            headers=player_auth_headers
        )

        assert response.status_code == 403

    def test_register_videogame_unauthorized_without_token(self, client):
        file = ("game_icon.png", io.BytesIO(b"data"), "image/png")
        data = {"name": "Apex Legends"}

        response = client.post("/api/v1/videogames/", data=data, files={"icon": file})
        assert response.status_code == 401

    def test_register_videogame_duplicate_name(self, client, admin_auth_headers, seed_catalog_data):
        file = ("game_icon.png", io.BytesIO(b"data"), "image/png")
        existing_name = seed_catalog_data["videogame"].name
        data = {"name": existing_name}

        response = client.post(
            "/api/v1/videogames/",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )

        assert response.status_code == 409
        assert "ya existe" in response.json().get("error", "").lower()

    def test_register_videogame_empty_name(self, client, admin_auth_headers):
        file = ("game_icon.png", io.BytesIO(b"data"), "image/png")
        data = {"name": "   "}

        response = client.post(
            "/api/v1/videogames/",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )

        assert response.status_code == 400

    def test_register_videogame_missing_file(self, client, admin_auth_headers):
        data = {"name": "Game Without Icon"}

        response = client.post(
            "/api/v1/videogames/",
            data=data,
            headers=admin_auth_headers
        )

        assert response.status_code == 422

    # ---------------------------------------------------------
    # PUT /api/v1/videogames/{videogame_id}
    # ---------------------------------------------------------

    def test_update_videogame_success(self, client, admin_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("updated_game_icon.png", io.BytesIO(b"updated-icon-data"), "image/png")
        data = {"name": "Updated Game Name"}

        response = client.put(
            f"/api/v1/videogames/{vg_id}",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        res_data = response.json()
        assert res_data["id"] == vg_id
        assert res_data["name"] == "Updated Game Name"
        assert res_data["icon_url"].startswith("/media/games/")

    def test_update_videogame_not_found(self, client, admin_auth_headers):
        file = ("icon.png", io.BytesIO(b"data"), "image/png")
        data = {"name": "Nonexistent"}

        response = client.put(
            "/api/v1/videogames/99999",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )

        assert response.status_code == 404

    def test_update_videogame_forbidden_for_player(self, client, player_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("icon.png", io.BytesIO(b"data"), "image/png")
        data = {"name": "Forbidden Update"}

        response = client.put(
            f"/api/v1/videogames/{vg_id}",
            data=data,
            files={"icon": file},
            headers=player_auth_headers
        )

        assert response.status_code == 403

    def test_update_videogame_unauthorized(self, client, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("icon.png", io.BytesIO(b"data"), "image/png")
        data = {"name": "No Auth"}

        response = client.put(f"/api/v1/videogames/{vg_id}", data=data, files={"icon": file})
        assert response.status_code == 401

    # ---------------------------------------------------------
    # GET /api/v1/videogames/
    # ---------------------------------------------------------

    def test_get_all_videogames_success(self, client, player_auth_headers, seed_catalog_data):
        response = client.get("/api/v1/videogames/", headers=player_auth_headers)

        assert response.status_code == 200
        res_data = response.json()
        assert "videogames" in res_data
        assert len(res_data["videogames"]) >= 1
        vg_names = [v["name"] for v in res_data["videogames"]]
        assert seed_catalog_data["videogame"].name in vg_names

    def test_get_all_videogames_unauthorized(self, client):
        response = client.get("/api/v1/videogames/")
        assert response.status_code == 401
