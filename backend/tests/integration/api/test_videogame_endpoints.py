import io
import pytest


class TestVideogameEndpointsIntegration:

    # ---------------------------------------------------------
    # POST /api/v1/videogames/
    # ---------------------------------------------------------

    def test_register_videogame_success(self, client, admin_auth_headers):
        file = ("game_icon.png", io.BytesIO(b"fake-game-icon-data"), "image/png")
        data = {"name": "Overwatch 2", "rank_per_role": True}

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
        assert res_data["rank_per_role"] is True

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
        data = {"name": existing_name, "rank_per_role": True}

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
        data = {"name": "   ", "rank_per_role": True}

        response = client.post(
            "/api/v1/videogames/",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )

        assert response.status_code == 400

    def test_register_videogame_missing_file(self, client, admin_auth_headers):
        data = {"name": "Game Without Icon", "rank_per_role": True}

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
        data = {"name": "Updated Game Name", "rank_per_role": False}

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
        assert res_data["rank_per_role"] is False

    def test_update_videogame_empty_name(self, client, admin_auth_headers, seed_catalog_data):
        # Probar modificar un videojuego sin ingresar el nombre (falla)
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("icon.png", io.BytesIO(b"data"), "image/png")
        data = {"name": "   ", "rank_per_role": False}

        response = client.put(
            f"/api/v1/videogames/{vg_id}",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )
        assert response.status_code == 400

    def test_update_videogame_duplicate_name(self, client, admin_auth_headers, seed_catalog_data, test_db_session):
        # Probar modificar un videojuego utilizando un nombre que ya esté registrado en otro videojuego (falla)
        from app.infrastructure.database.models.videogame_orm import VideogameORM
        vg2 = VideogameORM(name="Valorant", icon_url="/val.png", rank_per_role=False)
        test_db_session.add(vg2)
        test_db_session.commit()
        test_db_session.refresh(vg2)

        vg1_id = seed_catalog_data["videogame"].videogame_id
        file = ("icon.png", io.BytesIO(b"data"), "image/png")
        data = {"name": "Valorant", "rank_per_role": False}

        response = client.put(
            f"/api/v1/videogames/{vg1_id}",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )
        assert response.status_code == 409
        assert "ya existe" in response.json().get("error", "").lower()

    def test_update_videogame_not_found(self, client, admin_auth_headers):
        file = ("icon.png", io.BytesIO(b"data"), "image/png")
        data = {"name": "Nonexistent", "rank_per_role": False}

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
        # Probar consultar la lista teniendo videojuegos registrados (pasa)
        response = client.get("/api/v1/videogames/", headers=player_auth_headers)

        assert response.status_code == 200
        res_data = response.json()
        assert "videogames" in res_data
        assert len(res_data["videogames"]) >= 1
        vg_names = [v["name"] for v in res_data["videogames"]]
        assert seed_catalog_data["videogame"].name in vg_names
        assert "rank_per_role" in res_data["videogames"][0]

    def test_get_all_videogames_after_registering_new(self, client, admin_auth_headers, player_auth_headers):
        # Probar consultar la lista luego de registrar un nuevo videojuego (pasa)
        file = ("cs2.png", io.BytesIO(b"icon-data"), "image/png")
        reg_res = client.post(
            "/api/v1/videogames/",
            data={"name": "Counter-Strike 2", "rank_per_role": False},
            files={"icon": file},
            headers=admin_auth_headers
        )
        assert reg_res.status_code == 201

        list_res = client.get("/api/v1/videogames/", headers=player_auth_headers)
        assert list_res.status_code == 200
        names = [v["name"] for v in list_res.json()["videogames"]]
        assert "Counter-Strike 2" in names

    def test_get_all_videogames_after_modifying_name(self, client, admin_auth_headers, player_auth_headers, seed_catalog_data):
        # Probar consultar la lista luego de modificar el nombre de un videojuego (pasa)
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("icon.png", io.BytesIO(b"data"), "image/png")
        put_res = client.put(
            f"/api/v1/videogames/{vg_id}",
            data={"name": "League of Legends Remastered", "rank_per_role": True},
            files={"icon": file},
            headers=admin_auth_headers
        )
        assert put_res.status_code == 200

        list_res = client.get("/api/v1/videogames/", headers=player_auth_headers)
        assert list_res.status_code == 200
        names = [v["name"] for v in list_res.json()["videogames"]]
        assert "League of Legends Remastered" in names
        assert "League of Legends" not in names

    def test_get_all_videogames_after_deleting_videogame(self, client, player_auth_headers, test_db_session):
        # Probar consultar la lista luego de eliminar un videojuego (pasa)
        from app.infrastructure.database.models.videogame_orm import VideogameORM
        vg_temp = VideogameORM(name="Temp Game To Delete", icon_url="/temp.png", rank_per_role=False)
        test_db_session.add(vg_temp)
        test_db_session.commit()
        test_db_session.refresh(vg_temp)

        res1 = client.get("/api/v1/videogames/", headers=player_auth_headers)
        assert "Temp Game To Delete" in [v["name"] for v in res1.json()["videogames"]]

        test_db_session.delete(vg_temp)
        test_db_session.commit()

        res2 = client.get("/api/v1/videogames/", headers=player_auth_headers)
        assert "Temp Game To Delete" not in [v["name"] for v in res2.json()["videogames"]]

    def test_get_all_videogames_unauthorized(self, client):
        response = client.get("/api/v1/videogames/")
        assert response.status_code == 401
