import pytest
from app.domain.models.user_role import UserRole
from app.infrastructure.database.models.user_orm import UserORM


class TestGameProfileEndpointsIntegration:

    # ---------------------------------------------------------
    # POST /api/v1/game_profiles/
    # ---------------------------------------------------------

    def test_create_game_profile_success(self, client, player_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        char_id = seed_catalog_data["characters"][0].character_id
        role_id = seed_catalog_data["roles"][0].role_id
        rank_id = seed_catalog_data["ranks"][0].rank_id

        payload = {
            "videogame_id": vg_id,
            "character_ids": [char_id],
            "roles": [{"role_id": role_id, "rank_id": rank_id}]
        }

        response = client.post("/api/v1/game_profiles/", json=payload, headers=player_auth_headers)

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
        assert response.status_code == 401

    def test_create_game_profile_duplicate_for_player(self, client, player_auth_headers, seed_catalog_data):
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
        res1 = client.post("/api/v1/game_profiles/", json=payload, headers=player_auth_headers)
        assert res1.status_code == 201

        # Second creation fails with domain exception status_code (400)
        res2 = client.post("/api/v1/game_profiles/", json=payload, headers=player_auth_headers)
        assert res2.status_code == 400
        assert "already has a profile created" in res2.json().get("error", "")

    def test_create_game_profile_videogame_not_found(self, client, player_auth_headers, seed_catalog_data):
        payload = {
            "videogame_id": 99999,
            "character_ids": [seed_catalog_data["characters"][0].character_id],
            "roles": [{"role_id": seed_catalog_data["roles"][0].role_id, "rank_id": seed_catalog_data["ranks"][0].rank_id}]
        }

        response = client.post("/api/v1/game_profiles/", json=payload, headers=player_auth_headers)
        assert response.status_code == 404
        assert "99999" in response.json().get("error", "")

    def test_create_game_profile_character_not_found(self, client, player_auth_headers, seed_catalog_data):
        payload = {
            "videogame_id": seed_catalog_data["videogame"].videogame_id,
            "character_ids": [99999],
            "roles": [{"role_id": seed_catalog_data["roles"][0].role_id, "rank_id": seed_catalog_data["ranks"][0].rank_id}]
        }

        response = client.post("/api/v1/game_profiles/", json=payload, headers=player_auth_headers)
        assert response.status_code == 404
        assert "99999" in response.json().get("error", "")

    def test_create_game_profile_role_not_found(self, client, player_auth_headers, seed_catalog_data):
        payload = {
            "videogame_id": seed_catalog_data["videogame"].videogame_id,
            "character_ids": [seed_catalog_data["characters"][0].character_id],
            "roles": [{"role_id": 99999, "rank_id": seed_catalog_data["ranks"][0].rank_id}]
        }

        response = client.post("/api/v1/game_profiles/", json=payload, headers=player_auth_headers)
        assert response.status_code == 404
        assert "99999" in response.json().get("error", "")

    def test_create_game_profile_rank_not_found(self, client, player_auth_headers, seed_catalog_data):
        payload = {
            "videogame_id": seed_catalog_data["videogame"].videogame_id,
            "character_ids": [seed_catalog_data["characters"][0].character_id],
            "roles": [{"role_id": seed_catalog_data["roles"][0].role_id, "rank_id": 99999}]
        }

        response = client.post("/api/v1/game_profiles/", json=payload, headers=player_auth_headers)
        assert response.status_code == 404
        assert "99999" in response.json().get("error", "")

    def test_create_game_profile_empty_characters_validation(self, client, player_auth_headers, seed_catalog_data):
        payload = {
            "videogame_id": seed_catalog_data["videogame"].videogame_id,
            "character_ids": [],
            "roles": [{"role_id": seed_catalog_data["roles"][0].role_id, "rank_id": seed_catalog_data["ranks"][0].rank_id}]
        }

        response = client.post("/api/v1/game_profiles/", json=payload, headers=player_auth_headers)
        assert response.status_code == 422

    def test_create_game_profile_empty_roles_validation(self, client, player_auth_headers, seed_catalog_data):
        payload = {
            "videogame_id": seed_catalog_data["videogame"].videogame_id,
            "character_ids": [seed_catalog_data["characters"][0].character_id],
            "roles": []
        }

        response = client.post("/api/v1/game_profiles/", json=payload, headers=player_auth_headers)
        assert response.status_code == 422

    # ---------------------------------------------------------
    # PUT /api/v1/game_profiles/{game_profile_id}
    # ---------------------------------------------------------

    def test_update_game_profile_success(self, client, player_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        char1 = seed_catalog_data["characters"][0].character_id
        char2 = seed_catalog_data["characters"][1].character_id
        role1 = seed_catalog_data["roles"][0].role_id
        role2 = seed_catalog_data["roles"][1].role_id
        rank1 = seed_catalog_data["ranks"][0].rank_id
        rank2 = seed_catalog_data["ranks"][1].rank_id

        # 1. Create profile
        create_res = client.post("/api/v1/game_profiles/", json={
            "videogame_id": vg_id,
            "character_ids": [char1],
            "roles": [{"role_id": role1, "rank_id": rank1}]
        }, headers=player_auth_headers)
        assert create_res.status_code == 201
        profile_id = create_res.json()["profile_id"]

        # 2. Update profile
        update_payload = {
            "character_ids": [char2, char1],
            "roles_ranks": [
                {"role_id": role2, "rank_id": rank2}
            ]
        }
        update_res = client.put(f"/api/v1/game_profiles/{profile_id}", json=update_payload, headers=player_auth_headers)

        assert update_res.status_code == 200
        data = update_res.json()
        assert data["game_profile_id"] == profile_id
        assert len(data["characters"]) == 2
        assert len(data["role_profiles"]) == 1
        assert data["role_profiles"][0]["role"]["role_id"] == role2
        assert data["role_profiles"][0]["rank"]["rank_id"] == rank2

    def test_update_game_profile_not_found(self, client, player_auth_headers):
        update_payload = {
            "character_ids": [1],
            "roles_ranks": [{"role_id": 1, "rank_id": 1}]
        }
        response = client.put("/api/v1/game_profiles/99999", json=update_payload, headers=player_auth_headers)
        assert response.status_code == 404

    def test_update_game_profile_does_not_belong_to_player(self, client, player_auth_headers, jwt_service, test_db_session, password_hasher, seed_catalog_data):
        # Create a second player
        other_orm = UserORM(
            name="Other Player",
            username="otherplayer",
            mail="other@player.com",
            password_hash=password_hasher.hash_password("Password123"),
            role="player",
            icon_url="/media/users/icons/other.png"
        )
        test_db_session.add(other_orm)
        test_db_session.commit()
        test_db_session.refresh(other_orm)

        other_token, _, _, _ = jwt_service.generate_tokens(user_id=other_orm.user_id, role=UserRole.PLAYER)
        other_headers = {"Authorization": f"Bearer {other_token}"}

        vg_id = seed_catalog_data["videogame"].videogame_id
        char1 = seed_catalog_data["characters"][0].character_id
        role1 = seed_catalog_data["roles"][0].role_id
        rank1 = seed_catalog_data["ranks"][0].rank_id

        # Player 1 creates profile
        res1 = client.post("/api/v1/game_profiles/", json={
            "videogame_id": vg_id,
            "character_ids": [char1],
            "roles": [{"role_id": role1, "rank_id": rank1}]
        }, headers=player_auth_headers)
        profile_id = res1.json()["profile_id"]

        # Player 2 tries to update Player 1's profile
        update_res = client.put(f"/api/v1/game_profiles/{profile_id}", json={
            "character_ids": [char1],
            "roles_ranks": [{"role_id": role1, "rank_id": rank1}]
        }, headers=other_headers)

        assert update_res.status_code == 400
        assert "no pertenece" in update_res.json().get("error", "").lower()

    def test_update_game_profile_unauthorized(self, client):
        response = client.put("/api/v1/game_profiles/1", json={
            "character_ids": [1],
            "roles_ranks": [{"role_id": 1, "rank_id": 1}]
        })
        assert response.status_code == 401
