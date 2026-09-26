import io
import pytest

from app.infrastructure.database.models.videogame_orm import VideogameORM
from app.infrastructure.database.models.role_orm import RoleORM


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

    # ---------------------------------------------------------
    # PUT /api/v1/roles/{role_id}
    # ---------------------------------------------------------

    def test_update_role_admin_success(self, client, admin_auth_headers, seed_catalog_data):
        # Probar modificar un rol ingresando información válida y confirmar los cambios (pasa)
        role = seed_catalog_data["roles"][0]
        file = ("mid_carry.png", io.BytesIO(b"new-role-icon"), "image/png")
        data = {
            "name": "Mid Carry"
        }

        response = client.put(
            f"/api/v1/roles/{role.role_id}",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        res_data = response.json()
        assert res_data["role_id"] == role.role_id
        assert res_data["name"] == "Mid Carry"
        assert "roles" in res_data["icon_url"]

    def test_update_role_without_icon_success(self, client, admin_auth_headers, seed_catalog_data):
        # Modificar sólo el nombre sin enviar ícono conserva el ícono existente
        role = seed_catalog_data["roles"][0]
        original_icon = role.icon_url
        data = {
            "name": "Mid Laner"
        }

        response = client.put(
            f"/api/v1/roles/{role.role_id}",
            data=data,
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        res_data = response.json()
        assert res_data["role_id"] == role.role_id
        assert res_data["name"] == "Mid Laner"
        assert res_data["icon_url"] == original_icon

    def test_update_role_keep_name_change_icon_success(self, client, admin_auth_headers, seed_catalog_data):
        # Probar modificar un rol manteniendo su nombre actual y cambiando únicamente su ícono o descripción (pasa)
        role = seed_catalog_data["roles"][0]
        file = ("mid_shiny.png", io.BytesIO(b"shiny-mid-icon"), "image/png")
        data = {
            "name": role.name
        }

        response = client.put(
            f"/api/v1/roles/{role.role_id}",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        res_data = response.json()
        assert res_data["role_id"] == role.role_id
        assert res_data["name"] == role.name
        assert "roles" in res_data["icon_url"]

    def test_update_role_duplicate_name_different_game_passes(self, client, admin_auth_headers, test_db_session, seed_catalog_data):
        # Probar modificar un rol asignando un nombre que ya existe pero en otro videojuego diferente (pasa)
        vg2 = VideogameORM(name="Valorant", icon_url="/val.png", rank_per_role=False)
        test_db_session.add(vg2)
        test_db_session.flush()
        val_role = RoleORM(name="Controller", videogame_id=vg2.videogame_id, icon_url="/controller.png")
        test_db_session.add(val_role)
        test_db_session.commit()

        role_lol = seed_catalog_data["roles"][0]
        data = {
            "name": "Controller"
        }

        response = client.put(
            f"/api/v1/roles/{role_lol.role_id}",
            data=data,
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        res_data = response.json()
        assert res_data["role_id"] == role_lol.role_id
        assert res_data["name"] == "Controller"

    def test_update_role_empty_name(self, client, admin_auth_headers, seed_catalog_data):
        # Probar modificar el nombre de un rol dejando el campo vacío (falla)
        role = seed_catalog_data["roles"][0]
        data = {
            "name": "   "
        }

        response = client.put(
            f"/api/v1/roles/{role.role_id}",
            data=data,
            headers=admin_auth_headers
        )

        assert response.status_code == 400
        assert "inválido" in response.json().get("error", "").lower()

    def test_update_role_duplicate_name_same_game(self, client, admin_auth_headers, seed_catalog_data):
        # Probar modificar el nombre de un rol ingresando uno que ya existe en el mismo videojuego (falla)
        role1 = seed_catalog_data["roles"][0]
        role2 = seed_catalog_data["roles"][1]
        data = {
            "name": role2.name
        }

        response = client.put(
            f"/api/v1/roles/{role1.role_id}",
            data=data,
            headers=admin_auth_headers
        )

        assert response.status_code == 409
        assert "ya existe" in response.json().get("error", "").lower()

    def test_update_role_not_found(self, client, admin_auth_headers):
        data = {
            "name": "Nonexistent"
        }

        response = client.put(
            "/api/v1/roles/99999",
            data=data,
            headers=admin_auth_headers
        )

        assert response.status_code == 404

    def test_update_role_invalid_icon_filename(self, client, admin_auth_headers, seed_catalog_data):
        role = seed_catalog_data["roles"][0]
        file = ("", io.BytesIO(b"data"), "image/png")
        data = {
            "name": "Some Role"
        }

        response = client.put(
            f"/api/v1/roles/{role.role_id}",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )

        assert response.status_code in [400, 422]

    def test_update_role_forbidden_for_player(self, client, player_auth_headers, seed_catalog_data):
        role = seed_catalog_data["roles"][0]
        data = {
            "name": "Hacked Role"
        }

        response = client.put(
            f"/api/v1/roles/{role.role_id}",
            data=data,
            headers=player_auth_headers
        )

        assert response.status_code == 403

    def test_update_role_unauthorized(self, client, seed_catalog_data):
        role = seed_catalog_data["roles"][0]
        data = {
            "name": "No Auth Role"
        }

        response = client.put(f"/api/v1/roles/{role.role_id}", data=data)
        assert response.status_code == 401
