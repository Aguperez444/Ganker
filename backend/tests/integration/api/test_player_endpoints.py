import pytest


class TestPlayerEndpointsIntegration:

    def test_register_player_success(self, client):
        payload = {
            "name": "Jane Doe",
            "username": "janedoe",
            "mail": "jane.doe@example.com",
            "password": "SecurePassword123"
        }

        response = client.post("/api/v1/players/", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data.get("token_type") == "Bearer"

    def test_register_player_duplicate_email(self, client, seed_player):
        payload = {
            "name": "Duplicate Mail User",
            "username": "uniqueusername",
            "mail": seed_player.mail,  # existing email: john.doe@example.com
            "password": "SecurePassword123"
        }

        response = client.post("/api/v1/players/", json=payload)

        assert response.status_code == 409
        assert "Ya existe una cuenta registrada con el email" in response.json().get("error", "")

    def test_register_player_duplicate_username(self, client, seed_player):
        payload = {
            "name": "Duplicate Username User",
            "username": seed_player.username,  # existing username: johndoe
            "mail": "anothermail@example.com",
            "password": "SecurePassword123"
        }

        response = client.post("/api/v1/players/", json=payload)

        assert response.status_code == 409
        assert "ya está ocupado" in response.json().get("error", "")

    def test_register_player_insecure_password(self, client):
        payload = {
            "name": "Weak User",
            "username": "weakuser",
            "mail": "weak@example.com",
            "password": "short"
        }

        response = client.post("/api/v1/players/", json=payload)

        assert response.status_code == 400
        assert "La contraseña no es lo suficientemente segura" in response.json().get("error", "")

    def test_register_player_invalid_email_format(self, client):
        payload = {
            "name": "Bad Email User",
            "username": "bademailuser",
            "mail": "not-an-email",
            "password": "SecurePassword123"
        }

        response = client.post("/api/v1/players/", json=payload)

        assert response.status_code == 422

    def test_register_player_missing_fields(self, client):
        payload = {
            "name": "Incomplete User"
        }

        response = client.post("/api/v1/players/", json=payload)

        assert response.status_code == 422
