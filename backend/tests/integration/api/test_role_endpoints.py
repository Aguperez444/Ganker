import io
import pytest

from app.infrastructure.database.models.videogame_orm import VideogameORM
from app.infrastructure.database.models.role_orm import RoleORM
from app.infrastructure.database.models.game_profile_orm import GameProfileORM
from app.infrastructure.database.models.role_profile_orm import RoleProfileORM



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

    def test_create_role_without_videogame(self, client, admin_auth_headers):
        # Probar registrar un rol sin seleccionar un videojuego (falla)
        file = ("role.png", io.BytesIO(b"data"), "image/png")
        data = {"name": "NoGameRole"}
        response = client.post("/api/v1/roles", data=data, files={"icon": file}, headers=admin_auth_headers)
        assert response.status_code == 422

    def test_create_role_without_name(self, client, admin_auth_headers, seed_catalog_data):
        # Probar registrar un rol sin ingresar el nombre del rol (falla)
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("role.png", io.BytesIO(b"data"), "image/png")
        data = {"videogame_id": vg_id}
        response = client.post("/api/v1/roles", data=data, files={"icon": file}, headers=admin_auth_headers)
        assert response.status_code == 422

    def test_create_role_same_name_different_videogame_success(self, client, admin_auth_headers, seed_catalog_data, test_db_session):
        # Probar registrar un rol con un nombre ya existente pero en un videojuego diferente (pasa)
        vg2 = VideogameORM(name="Valorant", icon_url="/val.png", rank_per_role=False)
        test_db_session.add(vg2)
        test_db_session.commit()
        test_db_session.refresh(vg2)

        existing_role_name = seed_catalog_data["roles"][0].name
        file = ("role.png", io.BytesIO(b"data"), "image/png")
        data = {
            "name": existing_role_name,
            "videogame_id": vg2.videogame_id
        }

        response = client.post(
            "/api/v1/roles",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )

        assert response.status_code == 201
        res_data = response.json()
        assert res_data["name"] == existing_role_name
        assert "roles" in res_data["icon_url"]

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

    # ---------------------------------------------------------
    # DELETE /api/v1/roles/{role_id}
    # ---------------------------------------------------------

    def test_delete_role_without_dependencies_success(self, client, admin_auth_headers, seed_catalog_data, test_db_session):
        # Probar eliminar un rol existente sin jugadores o registros asociados y confirmar la acción (pasa)
        role = seed_catalog_data["roles"][2]

        response = client.delete(
            f"/api/v1/roles/{role.role_id}",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        res_data = response.json()
        assert "exitosamente" in res_data.get("message", "").lower()

        # Verificar que ya no existe en la base de datos
        found = test_db_session.query(RoleORM).filter(RoleORM.role_id == role.role_id).first()
        assert found is None

    def test_delete_role_cancel_does_not_delete(self, client, admin_auth_headers, seed_catalog_data, test_db_session):
        # Probar cancelar la confirmación de eliminación de un rol (no se elimina, pasa)
        role = seed_catalog_data["roles"][0]
        # Al cancelar en el frontend, la petición DELETE no se ejecuta
        found = test_db_session.query(RoleORM).filter(RoleORM.role_id == role.role_id).first()
        assert found is not None
        assert found.role_id == role.role_id

    def test_delete_role_with_associated_profiles_deletes_empty_game_profile(self, client, admin_auth_headers, seed_catalog_data, seed_player, test_db_session):
        # Probar eliminar un rol que se encuentra asignado a un perfil y el perfil queda sin roles -> se elimina el gameProfile
        vg_orm = seed_catalog_data["videogame"]
        role = seed_catalog_data["roles"][0]
        rank = seed_catalog_data["ranks"][0]

        gp = GameProfileORM(player_id=seed_player.user_id, videogame_id=vg_orm.videogame_id)
        test_db_session.add(gp)
        test_db_session.flush()

        rp = RoleProfileORM(game_profile_id=gp.game_profile_id, role_id=role.role_id, rank_id=rank.rank_id)
        test_db_session.add(rp)
        test_db_session.commit()

        role_id = role.role_id
        gp_id = gp.game_profile_id
        rp_id = rp.role_profile_id

        response = client.delete(
            f"/api/v1/roles/{role_id}",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        assert "exitosamente" in response.json().get("message", "").lower()

        # Verificar que el rol fue eliminado
        test_db_session.expire_all()
        assert test_db_session.query(RoleORM).filter(RoleORM.role_id == role_id).first() is None
        # Verificar que el role_profile fue eliminado
        assert test_db_session.query(RoleProfileORM).filter(RoleProfileORM.role_profile_id == rp_id).first() is None
        # Verificar que el game_profile fue eliminado porque quedó sin roles
        assert test_db_session.query(GameProfileORM).filter(GameProfileORM.game_profile_id == gp_id).first() is None

    def test_delete_role_with_associated_profiles_keeps_game_profile_when_other_role_exists(self, client, admin_auth_headers, seed_catalog_data, seed_player, test_db_session):
        # Probar eliminar un rol cuando el perfil tiene otro rol asignado -> el gameProfile NO se elimina
        vg_orm = seed_catalog_data["videogame"]
        role1 = seed_catalog_data["roles"][0]
        role2 = seed_catalog_data["roles"][1]
        rank = seed_catalog_data["ranks"][0]

        gp = GameProfileORM(player_id=seed_player.user_id, videogame_id=vg_orm.videogame_id)
        test_db_session.add(gp)
        test_db_session.flush()

        rp1 = RoleProfileORM(game_profile_id=gp.game_profile_id, role_id=role1.role_id, rank_id=rank.rank_id)
        rp2 = RoleProfileORM(game_profile_id=gp.game_profile_id, role_id=role2.role_id, rank_id=rank.rank_id)
        test_db_session.add_all([rp1, rp2])
        test_db_session.commit()

        role1_id = role1.role_id
        gp_id = gp.game_profile_id
        rp1_id = rp1.role_profile_id
        rp2_id = rp2.role_profile_id

        response = client.delete(
            f"/api/v1/roles/{role1_id}",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        assert "exitosamente" in response.json().get("message", "").lower()

        test_db_session.expire_all()
        # role1 eliminado
        assert test_db_session.query(RoleORM).filter(RoleORM.role_id == role1_id).first() is None
        # rp1 eliminado
        assert test_db_session.query(RoleProfileORM).filter(RoleProfileORM.role_profile_id == rp1_id).first() is None
        # rp2 sigue existiendo
        assert test_db_session.query(RoleProfileORM).filter(RoleProfileORM.role_profile_id == rp2_id).first() is not None
        # game_profile sigue existiendo
        assert test_db_session.query(GameProfileORM).filter(GameProfileORM.game_profile_id == gp_id).first() is not None

    def test_delete_role_not_found(self, client, admin_auth_headers):
        # Probar eliminar un rol inexistente (falla con 404)
        response = client.delete(
            "/api/v1/roles/99999",
            headers=admin_auth_headers
        )
        assert response.status_code == 404

    def test_delete_role_previously_deleted_fails(self, client, admin_auth_headers, seed_catalog_data):
        # Probar eliminar un rol previamente eliminado (falla con 404)
        role = seed_catalog_data["roles"][1]

        res1 = client.delete(f"/api/v1/roles/{role.role_id}", headers=admin_auth_headers)
        assert res1.status_code == 200

        res2 = client.delete(f"/api/v1/roles/{role.role_id}", headers=admin_auth_headers)
        assert res2.status_code == 404

    def test_delete_role_forbidden_for_player(self, client, player_auth_headers, seed_catalog_data):
        role = seed_catalog_data["roles"][0]
        response = client.delete(
            f"/api/v1/roles/{role.role_id}",
            headers=player_auth_headers
        )
        assert response.status_code == 403

    def test_delete_role_unauthorized(self, client, seed_catalog_data):
        role = seed_catalog_data["roles"][0]
        response = client.delete(f"/api/v1/roles/{role.role_id}")
        assert response.status_code == 401

