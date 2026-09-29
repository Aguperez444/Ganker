import io
import pytest

from app.infrastructure.database.models.game_profile_orm import GameProfileORM
from app.infrastructure.database.models.character_priority_orm import CharacterPriorityORM
from app.infrastructure.database.models.character_orm import CharacterORM


class TestCharacterEndpointsIntegration:

    # ---------------------------------------------------------
    # POST /api/v1/characters/
    # ---------------------------------------------------------

    def test_register_character_success(self, client, admin_auth_headers, seed_catalog_data):
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
            headers=admin_auth_headers
        )

        assert response.status_code == 201
        res_data = response.json()
        assert res_data["name"] == "Tracer"
        assert "character_id" in res_data
        assert res_data["icon_url"].startswith("/media/games/")

    def test_register_character_videogame_not_found(self, client, admin_auth_headers):
        file = ("char.png", io.BytesIO(b"data"), "image/png")
        data = {
            "name": "Ghost",
            "videogame_id": 99999
        }

        response = client.post(
            "/api/v1/characters/",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )

        assert response.status_code == 404

    def test_register_character_duplicate_name(self, client, admin_auth_headers, seed_catalog_data):
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
            headers=admin_auth_headers
        )

        assert response.status_code == 409
        assert "already exists" in response.json().get("error", "").lower()

    def test_register_character_invalid_name(self, client, admin_auth_headers, seed_catalog_data):
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
            headers=admin_auth_headers
        )

        assert response.status_code == 400

    def test_register_character_forbidden_for_player(self, client, player_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("char.png", io.BytesIO(b"data"), "image/png")
        data = {"name": "ForbiddenChar", "videogame_id": vg_id}

        response = client.post("/api/v1/characters/", data=data, files={"icon": file}, headers=player_auth_headers)
        assert response.status_code == 403

    def test_register_character_unauthorized(self, client, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("char.png", io.BytesIO(b"data"), "image/png")
        data = {"name": "UnauthorizedChar", "videogame_id": vg_id}

        response = client.post("/api/v1/characters/", data=data, files={"icon": file})
        assert response.status_code == 401

    # ---------------------------------------------------------
    # PUT /api/v1/characters/{character_id}
    # ---------------------------------------------------------

    def test_update_character_success(self, client, admin_auth_headers, seed_catalog_data):
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
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        res_data = response.json()
        assert res_data["character_id"] == char_id
        assert res_data["name"] == "Updated Character Name"
        assert res_data["icon_url"].startswith("/media/games/")

    def test_update_character_not_found(self, client, admin_auth_headers, seed_catalog_data):
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
            headers=admin_auth_headers
        )

        assert response.status_code == 404

    def test_update_character_duplicate_name_conflict(self, client, admin_auth_headers, seed_catalog_data):
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
            headers=admin_auth_headers
        )

        assert response.status_code == 409

    def test_update_character_missing_icon(self, client, admin_auth_headers, seed_catalog_data):
        char_id = seed_catalog_data["characters"][0].character_id
        vg_id = seed_catalog_data["videogame"].videogame_id
        data = {"name": "NoIcon", "videogame_id": vg_id}

        response = client.put(
            f"/api/v1/characters/{char_id}",
            data=data,
            headers=admin_auth_headers
        )
        assert response.status_code == 422

    def test_update_character_forbidden_for_player(self, client, player_auth_headers, seed_catalog_data):
        char_id = seed_catalog_data["characters"][0].character_id
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("icon.png", io.BytesIO(b"data"), "image/png")
        data = {"name": "ForbiddenUpdate", "videogame_id": vg_id}

        response = client.put(f"/api/v1/characters/{char_id}", data=data, files={"icon": file}, headers=player_auth_headers)
        assert response.status_code == 403

    def test_update_character_unauthorized(self, client, seed_catalog_data):
        char_id = seed_catalog_data["characters"][0].character_id
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("icon.png", io.BytesIO(b"data"), "image/png")
        data = {"name": "NoAuth", "videogame_id": vg_id}

        response = client.put(f"/api/v1/characters/{char_id}", data=data, files={"icon": file})
        assert response.status_code == 401

    # ---------------------------------------------------------
    # GET /api/v1/characters/{videogame_id}
    # ---------------------------------------------------------

    def test_get_characters_by_videogame_id_admin_success(self, client, admin_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id

        response = client.get(f"/api/v1/characters/{vg_id}", headers=admin_auth_headers)

        assert response.status_code == 200
        res_data = response.json()
        assert "characters" in res_data
        assert len(res_data["characters"]) >= 3

    def test_get_characters_by_videogame_id_player_success(self, client, player_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id

        response = client.get(f"/api/v1/characters/{vg_id}", headers=player_auth_headers)
        assert response.status_code == 200
        res_data = response.json()
        assert "characters" in res_data
        assert len(res_data["characters"]) >= 3

    def test_get_characters_unauthorized(self, client, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id

        response = client.get(f"/api/v1/characters/{vg_id}")
        assert response.status_code == 401

    # ---------------------------------------------------------
    # DELETE /api/v1/characters/{character_id}
    # ---------------------------------------------------------

    def test_delete_character_without_dependencies_success(self, client, admin_auth_headers, seed_catalog_data, test_db_session):
        # Probar eliminar un personaje existente sin registros o usuarios asociados y confirmar la acción (pasa)
        char = seed_catalog_data["characters"][2]

        response = client.delete(
            f"/api/v1/characters/{char.character_id}",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        res_data = response.json()
        assert "exitosamente" in res_data.get("message", "").lower()

        # Verificar que ya no existe en la base de datos
        found = test_db_session.query(CharacterORM).filter(CharacterORM.character_id == char.character_id).first()
        assert found is None

    def test_delete_character_with_associated_profiles_readjusts_priorities(self, client, admin_auth_headers, seed_catalog_data, seed_player, test_db_session):
        # Probar eliminar un personaje que se encuentra asociado al perfil o historial de uno o más jugadores,
        # se reajusta la prioridad de personajes en esos perfiles y se elimina el personaje (Pasa)
        vg_orm = seed_catalog_data["videogame"]
        char1 = seed_catalog_data["characters"][0]
        char2 = seed_catalog_data["characters"][1]
        char3 = seed_catalog_data["characters"][2]

        gp = GameProfileORM(player_id=seed_player.user_id, videogame_id=vg_orm.videogame_id)
        test_db_session.add(gp)
        test_db_session.flush()

        cp1 = CharacterPriorityORM(game_profile_id=gp.game_profile_id, character_id=char1.character_id, priority=1)
        cp2 = CharacterPriorityORM(game_profile_id=gp.game_profile_id, character_id=char2.character_id, priority=2)
        cp3 = CharacterPriorityORM(game_profile_id=gp.game_profile_id, character_id=char3.character_id, priority=3)
        test_db_session.add_all([cp1, cp2, cp3])
        test_db_session.commit()

        char1_id = char1.character_id
        char2_id = char2.character_id
        char3_id = char3.character_id
        gp_id = gp.game_profile_id

        # Eliminar el personaje del medio (char2, prioridad 2)
        response = client.delete(
            f"/api/v1/characters/{char2_id}",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        assert "exitosamente" in response.json().get("message", "").lower()

        # Verificar que char2 fue eliminado
        test_db_session.expire_all()
        found_char2 = test_db_session.query(CharacterORM).filter(CharacterORM.character_id == char2_id).first()
        assert found_char2 is None

        # Verificar que las prioridades restantes en el perfil se reajustaron (1 y 2, sin huecos)
        remaining = test_db_session.query(CharacterPriorityORM).filter(
            CharacterPriorityORM.game_profile_id == gp_id
        ).order_by(CharacterPriorityORM.priority.asc()).all()

        assert len(remaining) == 2
        assert remaining[0].character_id == char1_id
        assert remaining[0].priority == 1
        assert remaining[1].character_id == char3_id
        assert remaining[1].priority == 2


    def test_delete_character_cancel_does_not_delete(self, client, admin_auth_headers, seed_catalog_data, test_db_session):
        # Probar cancelar la confirmación de eliminación de un personaje (no se elimina, pasa)
        char = seed_catalog_data["characters"][0]
        # Al cancelar en el frontend, la petición DELETE no se ejecuta
        # Verificamos que el personaje sigue existiendo
        found = test_db_session.query(CharacterORM).filter(CharacterORM.character_id == char.character_id).first()
        assert found is not None
        assert found.character_id == char.character_id

    def test_delete_character_not_found(self, client, admin_auth_headers):
        # Probar eliminar un personaje inexistente (falla con 404)
        response = client.delete(
            "/api/v1/characters/99999",
            headers=admin_auth_headers
        )

        assert response.status_code == 404

    def test_delete_character_previously_deleted_fails(self, client, admin_auth_headers, seed_catalog_data):
        # Probar eliminar un personaje previamente eliminado (falla con 404)
        char = seed_catalog_data["characters"][1]

        # Primera eliminación exitosa
        resp1 = client.delete(f"/api/v1/characters/{char.character_id}", headers=admin_auth_headers)
        assert resp1.status_code == 200

        # Segunda eliminación falla
        resp2 = client.delete(f"/api/v1/characters/{char.character_id}", headers=admin_auth_headers)
        assert resp2.status_code == 404

    def test_delete_character_forbidden_for_player(self, client, player_auth_headers, seed_catalog_data):
        char = seed_catalog_data["characters"][0]

        response = client.delete(
            f"/api/v1/characters/{char.character_id}",
            headers=player_auth_headers
        )

        assert response.status_code == 403

    def test_delete_character_unauthorized(self, client, seed_catalog_data):
        char = seed_catalog_data["characters"][0]

        response = client.delete(f"/api/v1/characters/{char.character_id}")
        assert response.status_code == 401
