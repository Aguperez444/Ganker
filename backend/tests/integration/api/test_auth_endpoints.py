import pytest


class TestAuthEndpointsIntegration:

    # ---------------------------------------------------------
    # POST /auth/v1/login
    # ---------------------------------------------------------

    def test_login_success(self, client, seed_player):
        form_data = {
            "username": seed_player.mail,  # OAuth2 form uses 'username' field for email/login identifier
            "password": "Password123"
        }

        response = client.post("/auth/v1/login", data=form_data)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data.get("token_type") == "Bearer"

    def test_login_email_not_found(self, client):
        form_data = {
            "username": "unregistered@example.com",
            "password": "Password123"
        }

        response = client.post("/auth/v1/login", data=form_data)

        assert response.status_code == 404
        assert "No se encontró ninguna cuenta registrada" in response.json().get("error", "")

    def test_login_wrong_password(self, client, seed_player):
        form_data = {
            "username": seed_player.mail,
            "password": "IncorrectPassword123"
        }

        response = client.post("/auth/v1/login", data=form_data)

        assert response.status_code == 401
        assert "La contraseña es incorrecta" in response.json().get("error", "")

    def test_login_missing_form_fields(self, client):
        response = client.post("/auth/v1/login", data={"username": "test@example.com"})
        assert response.status_code == 422

    # ---------------------------------------------------------
    # POST /auth/v1/refresh
    # ---------------------------------------------------------

    def test_refresh_token_success(self, client, seed_player):
        # First log in to obtain tokens and save refresh token to DB
        login_res = client.post("/auth/v1/login", data={
            "username": seed_player.mail,
            "password": "Password123"
        })
        assert login_res.status_code == 200
        refresh_token = login_res.json()["refresh_token"]

        # Call /auth/v1/refresh
        refresh_res = client.post("/auth/v1/refresh", json={"refresh_token": refresh_token})

        assert refresh_res.status_code == 200
        data = refresh_res.json()
        assert "access_token" in data
        assert "refresh_token" in data
        # New refresh token is rotated (different from original)
        assert data["refresh_token"] != refresh_token

    def test_refresh_token_revoked_on_reuse(self, client, seed_player):
        # Login and get refresh token
        login_res = client.post("/auth/v1/login", data={
            "username": seed_player.mail,
            "password": "Password123"
        })
        refresh_token = login_res.json()["refresh_token"]

        # First refresh succeeds
        ref1 = client.post("/auth/v1/refresh", json={"refresh_token": refresh_token})
        assert ref1.status_code == 200

        # Second refresh using old rotated token fails
        ref2 = client.post("/auth/v1/refresh", json={"refresh_token": refresh_token})
        assert ref2.status_code == 401
        assert "revocado" in ref2.json().get("error", "").lower()

    def test_refresh_token_invalid_jwt(self, client):
        response = client.post("/auth/v1/refresh", json={"refresh_token": "totally.invalid.token"})
        assert response.status_code == 401

    def test_refresh_token_missing_field(self, client):
        response = client.post("/auth/v1/refresh", json={})
        assert response.status_code == 422

    # ---------------------------------------------------------
    # POST /auth/v1/logout
    # ---------------------------------------------------------

    def test_logout_success(self, client, seed_player):
        login_res = client.post("/auth/v1/login", data={
            "username": seed_player.mail,
            "password": "Password123"
        })
        refresh_token = login_res.json()["refresh_token"]

        logout_res = client.post("/auth/v1/logout", json={"refresh_token": refresh_token})
        assert logout_res.status_code == 204

        # After logout, attempting to refresh using that token must fail
        refresh_res = client.post("/auth/v1/refresh", json={"refresh_token": refresh_token})
        assert refresh_res.status_code == 401

    def test_logout_already_revoked_token_fails(self, client, seed_player):
        login_res = client.post("/auth/v1/login", data={
            "username": seed_player.mail,
            "password": "Password123"
        })
        refresh_token = login_res.json()["refresh_token"]

        # First logout succeeds
        logout_res1 = client.post("/auth/v1/logout", json={"refresh_token": refresh_token})
        assert logout_res1.status_code == 204

        # Second logout with same token fails with 401
        logout_res2 = client.post("/auth/v1/logout", json={"refresh_token": refresh_token})
        assert logout_res2.status_code == 401
        assert "revok" in logout_res2.json().get("error", "").lower()

    def test_logout_invalid_jwt(self, client):
        response = client.post("/auth/v1/logout", json={"refresh_token": "invalid.jwt.token"})
        assert response.status_code == 401

    def test_logout_missing_field(self, client):
        response = client.post("/auth/v1/logout", json={})
        assert response.status_code == 422
