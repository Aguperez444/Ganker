from app.domain.models.user_role import UserRole
from app.infrastructure.database.models.game_profile_orm import GameProfileORM
from app.infrastructure.database.models.role_profile_orm import RoleProfileORM


class TestSoftDeleteEndpoints:

    def _seed_game_profile(self, session, player_id, catalog):
        vg = catalog["videogame"]
        roles = catalog["roles"]
        ranks = catalog["ranks"]
        gp = GameProfileORM(player_id=player_id, videogame_id=vg.videogame_id, in_game_name="Player#LAS")
        session.add(gp)
        session.flush()
        rp = RoleProfileORM(game_profile_id=gp.game_profile_id, role_id=roles[0].role_id, rank_id=ranks[0].rank_id)
        session.add(rp)
        session.commit()
        session.refresh(gp)
        return gp

    def test_delete_game_profile_endpoint_and_404_on_repeat(
        self, client, test_db_session, seed_player, player_auth_headers, seed_catalog_data
    ):
        gp1 = self._seed_game_profile(test_db_session, seed_player.user_id, seed_catalog_data)

        # Delete via /api/v1/game_profiles/{id}
        res = client.delete(f"/api/v1/game_profiles/{gp1.game_profile_id}", headers=player_auth_headers)
        assert res.status_code == 200
        assert "exitosamente" in res.json()["message"].lower()

        # Repeat delete returns 404 Not Found
        res_repeat = client.delete(f"/api/v1/game_profiles/{gp1.game_profile_id}", headers=player_auth_headers)
        assert res_repeat.status_code == 404

    def test_delete_videogame_endpoint_permissions_and_cascade(
        self,
        client,
        test_db_session,
        seed_player,
        player_auth_headers,
        admin_auth_headers,
        seed_catalog_data,
    ):
        vg_id = seed_catalog_data["videogame"].videogame_id
        self._seed_game_profile(test_db_session, seed_player.user_id, seed_catalog_data)

        # Player cannot delete a videogame (403)
        res_forbidden = client.delete(f"/api/v1/videogames/{vg_id}", headers=player_auth_headers)
        assert res_forbidden.status_code == 403

        # Admin can delete the videogame (200)
        res_ok = client.delete(f"/api/v1/videogames/{vg_id}", headers=admin_auth_headers)
        assert res_ok.status_code == 200

        # Repeat delete returns 404
        res_404 = client.delete(f"/api/v1/videogames/{vg_id}", headers=admin_auth_headers)
        assert res_404.status_code == 404

        # Listing videogames returns empty list
        res_list = client.get("/api/v1/videogames/", headers=player_auth_headers)
        assert res_list.status_code == 200
        assert res_list.json()["videogames"] == []

    def test_delete_user_me_revokes_session_and_returns_404_after(
        self, client, test_db_session, seed_player, seed_catalog_data
    ):
        self._seed_game_profile(test_db_session, seed_player.user_id, seed_catalog_data)

        # Login to get access + refresh tokens
        login_res = client.post(
            "/auth/v1/login",
            data={"username": seed_player.mail, "password": "Password123"},
        )
        assert login_res.status_code == 200
        tokens = login_res.json()
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        refresh_cookie = login_res.cookies.get("refresh_token")

        # Delete own user via /api/v1/users/me
        del_res = client.delete("/api/v1/users/me", headers=headers)
        assert del_res.status_code == 200

        # Subsequent GET /api/v1/users/me returns 404
        me_res = client.get("/api/v1/users/me", headers=headers)
        assert me_res.status_code == 404

        # Subsequent refresh token attempt fails (401) because refresh token was revoked
        refresh_res = client.post("/auth/v1/refresh", json={"refresh_token": tokens["refresh_token"]})
        assert refresh_res.status_code == 401

        # Subsequent login fails (404)
        login_after = client.post(
            "/auth/v1/login",
            data={"username": seed_player.mail, "password": "Password123"},
        )
        assert login_after.status_code in (401, 404)

    def test_delete_user_by_id_permissions(
        self,
        client,
        seed_player,
        seed_admin,
        seed_owner,
        player_auth_headers,
        admin_auth_headers,
    ):
        # Player cannot delete admin (403)
        res1 = client.delete(f"/api/v1/users/{seed_admin.user_id}", headers=player_auth_headers)
        assert res1.status_code == 403

        # Admin cannot delete owner (403)
        res2 = client.delete(f"/api/v1/users/{seed_owner.user_id}", headers=admin_auth_headers)
        assert res2.status_code == 403

        # Admin can delete player (200)
        res3 = client.delete(f"/api/v1/users/{seed_player.user_id}", headers=admin_auth_headers)
        assert res3.status_code == 200

        # Deleting again returns 404
        res4 = client.delete(f"/api/v1/users/{seed_player.user_id}", headers=admin_auth_headers)
        assert res4.status_code == 404
