import pytest


class TestGameProfileEndpointsIntegration:

    @pytest.fixture
    def auth_headers(self, jwt_service, seed_player):
        access_token, _ = jwt_service.generate_tokens(user_id=seed_player.player_id)
        return {"Authorization": f"Bearer {access_token}"}

    def test_create_game_profile_success(self, client, auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        char_id = seed_catalog_data["characters"][0].character_id
        role_id = seed_catalog_data["roles"][0].role_id
        rank_id = seed_catalog_data["ranks"][0].rank_id

        payload = {
            "videogame_id": vg_id,
            "character_ids": [char_id],
            "roles": [{"role_id": role_id, "rank_id": rank_id}]
        }

        response = client.post("/api/v1/game_profiles/", json=payload, headers=auth_headers)

        assert response.status_code == 201
        data = response.json()
        assert "profile_id" in data
        assert isinstance(data["profile_id"], int)

    def test_create_game_profile_unauthorized_without_token(self, client, seed_catalog_data):
        payload = {
            "videogame_id": seed_catalog_data["videogame"].videogame_id,
            "character_ids": [seed_catalog_data["characters"][0].character_id],
            "roles": [{"role_id": seed_catalog_data["roles"][0].role_id, "rank_id": seed_catalog_data["ranks"][0].rank_id}]
        }

        response = client.post("/api/v1/game_profiles/", json=payload)
        assert response.status_code == 401

    def test_create_game_profile_unauthorized_invalid_token(self, client, seed_catalog_data):
        payload = {
            "videogame_id": seed_catalog_data["videogame"].videogame_id,
            "character_ids": [seed_catalog_data["characters"][0].character_id],
            "roles": [{"role_id": seed_catalog_data["roles"][0].role_id, "rank_id": seed_catalog_data["ranks"][0].rank_id}]
        }

        response = client.post(
            "/api/v1/game_profiles/",
            json=payload,
            headers={"Authorization": "Bearer invalid_token_string"}
        )
        assert response.status_code in [401, 403]

    def test_create_game_profile_duplicate_for_player(self, client, auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        char_id = seed_catalog_data["characters"][0].character_id
        role_id = seed_catalog_data["roles"][0].role_id
        rank_id = seed_catalog_data["ranks"][0].rank_id

        payload = {
            "videogame_id": vg_id,
            "character_ids": [char_id],
            "roles": [{"role_id": role_id, "rank_id": rank_id}]
        }

        # First creation succeeds
        res1 = client.post("/api/v1/game_profiles/", json=payload, headers=auth_headers)
        assert res1.status_code == 201

        # Second creation fails with domain exception status_code (400)
        res2 = client.post("/api/v1/game_profiles/", json=payload, headers=auth_headers)
        assert res2.status_code == 400
        assert "already has a profile created" in res2.json().get("error", "")

    def test_create_game_profile_videogame_not_found(self, client, auth_headers, seed_catalog_data):
        payload = {
            "videogame_id": 99999,
            "character_ids": [seed_catalog_data["characters"][0].character_id],
            "roles": [{"role_id": seed_catalog_data["roles"][0].role_id, "rank_id": seed_catalog_data["ranks"][0].rank_id}]
        }

        response = client.post("/api/v1/game_profiles/", json=payload, headers=auth_headers)
        assert response.status_code == 404
        assert "99999" in response.json().get("error", "")

    def test_create_game_profile_character_not_found(self, client, auth_headers, seed_catalog_data):
        payload = {
            "videogame_id": seed_catalog_data["videogame"].videogame_id,
            "character_ids": [99999],
            "roles": [{"role_id": seed_catalog_data["roles"][0].role_id, "rank_id": seed_catalog_data["ranks"][0].rank_id}]
        }

        response = client.post("/api/v1/game_profiles/", json=payload, headers=auth_headers)
        assert response.status_code == 404
        assert "99999" in response.json().get("error", "")

    def test_create_game_profile_role_not_found(self, client, auth_headers, seed_catalog_data):
        payload = {
            "videogame_id": seed_catalog_data["videogame"].videogame_id,
            "character_ids": [seed_catalog_data["characters"][0].character_id],
            "roles": [{"role_id": 99999, "rank_id": seed_catalog_data["ranks"][0].rank_id}]
        }

        response = client.post("/api/v1/game_profiles/", json=payload, headers=auth_headers)
        assert response.status_code == 404
        assert "99999" in response.json().get("error", "")

    def test_create_game_profile_rank_not_found(self, client, auth_headers, seed_catalog_data):
        payload = {
            "videogame_id": seed_catalog_data["videogame"].videogame_id,
            "character_ids": [seed_catalog_data["characters"][0].character_id],
            "roles": [{"role_id": seed_catalog_data["roles"][0].role_id, "rank_id": 99999}]
        }

        response = client.post("/api/v1/game_profiles/", json=payload, headers=auth_headers)
        assert response.status_code == 404
        assert "99999" in response.json().get("error", "")

    def test_create_game_profile_empty_characters_validation(self, client, auth_headers, seed_catalog_data):
        payload = {
            "videogame_id": seed_catalog_data["videogame"].videogame_id,
            "character_ids": [],
            "roles": [{"role_id": seed_catalog_data["roles"][0].role_id, "rank_id": seed_catalog_data["ranks"][0].rank_id}]
        }

        response = client.post("/api/v1/game_profiles/", json=payload, headers=auth_headers)
        assert response.status_code == 422

    def test_create_game_profile_empty_roles_validation(self, client, auth_headers, seed_catalog_data):
        payload = {
            "videogame_id": seed_catalog_data["videogame"].videogame_id,
            "character_ids": [seed_catalog_data["characters"][0].character_id],
            "roles": []
        }

        response = client.post("/api/v1/game_profiles/", json=payload, headers=auth_headers)
        assert response.status_code == 422
