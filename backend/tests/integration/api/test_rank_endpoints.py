import io
import pytest


class TestRankEndpointsIntegration:

    # ---------------------------------------------------------
    # POST /api/v1/ranks
    # ---------------------------------------------------------

    def test_create_rank_admin_success(self, client, admin_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("challenger.png", io.BytesIO(b"fake-rank-icon"), "image/png")
        data = {
            "name": "Challenger",
            "value": 5000,
            "videogame_id": vg_id
        }

        response = client.post(
            "/api/v1/ranks",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )

        assert response.status_code == 201
        res_data = response.json()
        assert res_data["name"] == "Challenger"
        assert res_data["value"] == 5000
        assert res_data["icon_url"].startswith("/media/")
        assert "ranks" in res_data["icon_url"]

    def test_create_rank_videogame_not_found(self, client, admin_auth_headers):
        file = ("rank.png", io.BytesIO(b"data"), "image/png")
        data = {
            "name": "Ghost Rank",
            "value": 100,
            "videogame_id": 99999
        }

        response = client.post(
            "/api/v1/ranks",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )

        assert response.status_code == 404

    def test_create_rank_duplicate_name(self, client, admin_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        existing_rank_name = seed_catalog_data["ranks"][0].name
        file = ("rank.png", io.BytesIO(b"data"), "image/png")
        data = {
            "name": existing_rank_name,
            "value": 9999,
            "videogame_id": vg_id
        }

        response = client.post(
            "/api/v1/ranks",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )

        assert response.status_code == 409
        assert "ya existe" in response.json().get("error", "").lower()

    def test_create_rank_duplicate_value(self, client, admin_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        existing_rank_value = seed_catalog_data["ranks"][0].value
        file = ("rank.png", io.BytesIO(b"data"), "image/png")
        data = {
            "name": "Brand New Rank Name",
            "value": existing_rank_value,
            "videogame_id": vg_id
        }

        response = client.post(
            "/api/v1/ranks",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )

        assert response.status_code == 409
        assert "ya existe" in response.json().get("error", "").lower()

    def test_create_rank_invalid_name(self, client, admin_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("rank.png", io.BytesIO(b"data"), "image/png")
        data = {
            "name": "   ",
            "value": 50,
            "videogame_id": vg_id
        }

        response = client.post(
            "/api/v1/ranks",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )

        assert response.status_code == 400

    def test_create_rank_negative_value(self, client, admin_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("rank.png", io.BytesIO(b"data"), "image/png")
        data = {
            "name": "Negative Rank",
            "value": -5,
            "videogame_id": vg_id
        }

        response = client.post(
            "/api/v1/ranks",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )

        assert response.status_code == 400

    def test_create_rank_missing_icon(self, client, admin_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        data = {
            "name": "NoIconRank",
            "value": 50,
            "videogame_id": vg_id
        }

        response = client.post(
            "/api/v1/ranks",
            data=data,
            headers=admin_auth_headers
        )

        assert response.status_code == 422

    def test_create_rank_forbidden_for_player(self, client, player_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("rank.png", io.BytesIO(b"data"), "image/png")
        data = {
            "name": "ForbiddenRank",
            "value": 50,
            "videogame_id": vg_id
        }

        response = client.post(
            "/api/v1/ranks",
            data=data,
            files={"icon": file},
            headers=player_auth_headers
        )

        assert response.status_code == 403

    def test_create_rank_unauthorized(self, client, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        file = ("rank.png", io.BytesIO(b"data"), "image/png")
        data = {"name": "NoAuthRank", "value": 50, "videogame_id": vg_id}

        response = client.post("/api/v1/ranks", data=data, files={"icon": file})
        assert response.status_code == 401

    # ---------------------------------------------------------
    # GET /api/v1/ranks/{videogame_id}
    # ---------------------------------------------------------

    def test_get_ranks_by_videogame_id_success(self, client, player_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id

        response = client.get(f"/api/v1/ranks/{vg_id}", headers=player_auth_headers)

        assert response.status_code == 200
        res_data = response.json()
        assert "ranks" in res_data
        assert len(res_data["ranks"]) >= 3
        rank_names = [r["name"] for r in res_data["ranks"]]
        assert seed_catalog_data["ranks"][0].name in rank_names

    def test_get_ranks_unauthorized(self, client, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id

        response = client.get(f"/api/v1/ranks/{vg_id}")
        assert response.status_code == 401

    # ---------------------------------------------------------
    # PUT /api/v1/ranks/{rank_id}
    # ---------------------------------------------------------

    def test_update_rank_admin_success(self, client, admin_auth_headers, seed_catalog_data):
        rank = seed_catalog_data["ranks"][0]
        file = ("emerald.png", io.BytesIO(b"new-emerald-icon"), "image/png")
        data = {
            "name": "Emerald",
            "value": 1500
        }

        response = client.put(
            f"/api/v1/ranks/{rank.rank_id}",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        res_data = response.json()
        assert res_data["rank_id"] == rank.rank_id
        assert res_data["name"] == "Emerald"
        assert res_data["value"] == 1500
        assert "ranks" in res_data["icon_url"]

    def test_update_rank_without_icon_success(self, client, admin_auth_headers, seed_catalog_data):
        # Probar modificar un rango manteniendo su nombre actual y cambiando únicamente su orden (pasa)
        rank = seed_catalog_data["ranks"][0]
        original_name = rank.name
        original_icon = rank.icon_url
        data = {
            "name": original_name,
            "value": 1100
        }

        response = client.put(
            f"/api/v1/ranks/{rank.rank_id}",
            data=data,
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        res_data = response.json()
        assert res_data["rank_id"] == rank.rank_id
        assert res_data["name"] == original_name
        assert res_data["value"] == 1100
        assert res_data["icon_url"] == original_icon

    def test_update_rank_change_only_icon_success(self, client, admin_auth_headers, seed_catalog_data):
        # Probar modificar un rango manteniendo su nombre y orden y cambiando únicamente su ícono (pasa)
        rank = seed_catalog_data["ranks"][0]
        file = ("gold_shiny.png", io.BytesIO(b"shiny-icon-data"), "image/png")
        data = {
            "name": rank.name,
            "value": rank.value
        }

        response = client.put(
            f"/api/v1/ranks/{rank.rank_id}",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        res_data = response.json()
        assert res_data["rank_id"] == rank.rank_id
        assert res_data["name"] == rank.name
        assert res_data["value"] == rank.value
        assert "ranks" in res_data["icon_url"]

    def test_update_rank_empty_name(self, client, admin_auth_headers, seed_catalog_data):
        # Probar modificar el nombre de un rango dejando el campo vacío (falla)
        rank = seed_catalog_data["ranks"][0]
        data = {
            "name": "   ",
            "value": 1200
        }

        response = client.put(
            f"/api/v1/ranks/{rank.rank_id}",
            data=data,
            headers=admin_auth_headers
        )

        assert response.status_code == 400
        assert "inválido" in response.json().get("error", "").lower()

    def test_update_rank_duplicate_name(self, client, admin_auth_headers, seed_catalog_data):
        # Probar modificar el nombre de un rango ingresando uno que ya existe en el mismo videojuego (falla)
        rank1 = seed_catalog_data["ranks"][0]
        rank2 = seed_catalog_data["ranks"][1]
        data = {
            "name": rank2.name,
            "value": 1200
        }

        response = client.put(
            f"/api/v1/ranks/{rank1.rank_id}",
            data=data,
            headers=admin_auth_headers
        )

        assert response.status_code == 409
        assert "ya existe" in response.json().get("error", "").lower()

    def test_update_rank_duplicate_value(self, client, admin_auth_headers, seed_catalog_data):
        # Probar modificar el orden jerárquico asignando uno ya utilizado por otro rango del mismo videojuego (falla)
        rank1 = seed_catalog_data["ranks"][0]
        rank2 = seed_catalog_data["ranks"][1]
        data = {
            "name": "Different Name",
            "value": rank2.value
        }

        response = client.put(
            f"/api/v1/ranks/{rank1.rank_id}",
            data=data,
            headers=admin_auth_headers
        )

        assert response.status_code == 409
        assert "ya existe" in response.json().get("error", "").lower()

    def test_update_rank_negative_value(self, client, admin_auth_headers, seed_catalog_data):
        rank = seed_catalog_data["ranks"][0]
        data = {
            "name": "Negative Rank",
            "value": -10
        }

        response = client.put(
            f"/api/v1/ranks/{rank.rank_id}",
            data=data,
            headers=admin_auth_headers
        )

        assert response.status_code == 400

    def test_update_rank_not_found(self, client, admin_auth_headers):
        data = {
            "name": "Nonexistent",
            "value": 1000
        }

        response = client.put(
            "/api/v1/ranks/99999",
            data=data,
            headers=admin_auth_headers
        )

        assert response.status_code == 404

    def test_update_rank_invalid_icon_filename(self, client, admin_auth_headers, seed_catalog_data):
        rank = seed_catalog_data["ranks"][0]
        file = ("", io.BytesIO(b"data"), "image/png")
        data = {
            "name": "Some Rank",
            "value": 1000
        }

        response = client.put(
            f"/api/v1/ranks/{rank.rank_id}",
            data=data,
            files={"icon": file},
            headers=admin_auth_headers
        )

        assert response.status_code in [400, 422]

    def test_update_rank_forbidden_for_player(self, client, player_auth_headers, seed_catalog_data):
        rank = seed_catalog_data["ranks"][0]
        data = {
            "name": "Hacked Rank",
            "value": 9999
        }

        response = client.put(
            f"/api/v1/ranks/{rank.rank_id}",
            data=data,
            headers=player_auth_headers
        )

        assert response.status_code == 403

    def test_update_rank_unauthorized(self, client, seed_catalog_data):
        rank = seed_catalog_data["ranks"][0]
        data = {
            "name": "No Auth Rank",
            "value": 1000
        }

        response = client.put(f"/api/v1/ranks/{rank.rank_id}", data=data)
        assert response.status_code == 401

