import pytest


class TestAuthEndpointsIntegration:

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
