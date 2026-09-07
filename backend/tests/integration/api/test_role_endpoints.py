import io
import pytest


class TestRoleEndpointsIntegration:

    # ---------------------------------------------------------
    # POST /api/v1/roles
    # ---------------------------------------------------------

    def test_create_role_admin_success(self, client, admin_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("duelist.png", io.BytesIO(b"fake-role-icon"), "image/png")
        data = {
            "name": "Duelist",
            "videogame_id": vg_id
        }

        response = client.post(
            "/api/v1/roles",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )

        assert response.status_code == 201
        res_data = response.json()
        assert res_data["name"] == "Duelist"
        assert "role_id" in res_data
        assert res_data["icon_url"].startswith("/media/games/")

    def test_create_role_videogame_not_found(self, client, admin_auth_headers):
        file = ("role.png", io.BytesIO(b"data"), "image/png")
        data = {
            "name": "Ghost Role",
            "videogame_id": 99999
        }

        response = client.post(
            "/api/v1/roles",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )

        assert response.status_code == 404

    def test_create_role_duplicate_name(self, client, admin_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        existing_role_name = seed_catalog_data["roles"][0].name
        file = ("role.png", io.BytesIO(b"data"), "image/png")
        data = {
            "name": existing_role_name,
            "videogame_id": vg_id
        }

        response = client.post(
            "/api/v1/roles",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )

        assert response.status_code == 409
        assert "ya existe" in response.json().get("error", "").lower()

    def test_create_role_invalid_name(self, client, admin_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("role.png", io.BytesIO(b"data"), "image/png")
        data = {
            "name": "   ",
            "videogame_id": vg_id
        }

        response = client.post(
            "/api/v1/roles",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )

        assert response.status_code == 400

    def test_create_role_missing_icon(self, client, admin_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        data = {
            "name": "NoIconRole",
            "videogame_id": vg_id
        }

        response = client.post(
            "/api/v1/roles",
            data=data,
            headers=admin_auth_headers
        )

        assert response.status_code == 422

    def test_create_role_forbidden_for_player(self, client, player_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("role.png", io.BytesIO(b"data"), "image/png")
        data = {
            "name": "ForbiddenRole",
            "videogame_id": vg_id
        }

        response = client.post(
            "/api/v1/roles",
            data=data,
            files={"icon": file},
            headers=player_auth_headers
        )

        assert response.status_code == 403

    def test_create_role_unauthorized(self, client, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("role.png", io.BytesIO(b"data"), "image/png")
        data = {"name": "NoAuthRole", "videogame_id": vg_id}

        response = client.post("/api/v1/roles", data=data, files={"icon": file})
        assert response.status_code == 401

    # ---------------------------------------------------------
    # GET /api/v1/roles/{videogame_id}
    # ---------------------------------------------------------

    def test_get_roles_by_videogame_id_success(self, client, player_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id

        response = client.get(f"/api/v1/roles/{vg_id}", headers=player_auth_headers)

        assert response.status_code == 200
        res_data = response.json()
        assert "roles" in res_data
        assert len(res_data["roles"]) >= 3
        role_names = [r["name"] for r in res_data["roles"]]
        assert seed_catalog_data["roles"][0].name in role_names

    def test_get_roles_unauthorized(self, client, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id

        response = client.get(f"/api/v1/roles/{vg_id}")
        assert response.status_code == 401
