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
