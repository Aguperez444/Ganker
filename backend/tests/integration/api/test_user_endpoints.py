import io
import pytest


class TestUserEndpointsIntegration:

    # ---------------------------------------------------------
    # POST /api/v1/users/register
    # ---------------------------------------------------------

    def test_register_player_success(self, client):
        payload = {
            "name": "Jane Doe",
            "username": "janedoe",
            "mail": "jane.doe@example.com",
            "password": "SecurePassword123"
        }

        response = client.post("/api/v1/users/register", json=payload)

        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data.get("token_type") == "Bearer"

    def test_register_player_duplicate_email(self, client, seed_player):
        payload = {
            "name": "Duplicate Mail User",
            "username": "uniqueusername",
            "mail": seed_player.mail,
            "password": "SecurePassword123"
        }

        response = client.post("/api/v1/users/register", json=payload)

        assert response.status_code == 409
        assert "Ya existe una cuenta registrada con el email" in response.json().get("error", "")

    def test_register_player_duplicate_username(self, client, seed_player):
        payload = {
            "name": "Duplicate Username User",
            "username": seed_player.username,
            "mail": "anothermail@example.com",
            "password": "SecurePassword123"
        }

        response = client.post("/api/v1/users/register", json=payload)

        assert response.status_code == 409
        assert "ya está ocupado" in response.json().get("error", "")

    def test_register_player_insecure_password(self, client):
        payload = {
            "name": "Weak User",
            "username": "weakuser",
            "mail": "weak@example.com",
            "password": "short"
        }

        response = client.post("/api/v1/users/register", json=payload)

        assert response.status_code == 400
        assert "La contraseña no es lo suficientemente segura" in response.json().get("error", "")

    def test_register_player_invalid_email_format(self, client):
        payload = {
            "name": "Bad Email User",
            "username": "bademailuser",
            "mail": "not-an-email",
            "password": "SecurePassword123"
        }

        response = client.post("/api/v1/users/register", json=payload)

        assert response.status_code == 422

    def test_register_player_missing_fields(self, client):
        payload = {
            "name": "Incomplete User"
        }

        response = client.post("/api/v1/users/register", json=payload)

        assert response.status_code == 422

    # ---------------------------------------------------------
    # POST /api/v1/users/register_user (Admin/Owner only)
    # ---------------------------------------------------------

    def test_register_user_as_admin_success(self, client, admin_auth_headers):
        payload = {
            "name": "New Mod",
            "username": "newmod",
            "mail": "newmod@example.com",
            "password": "SecurePassword123",
            "role": "player"
        }

        response = client.post("/api/v1/users/register_user", json=payload, headers=admin_auth_headers)

        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "newmod"
        assert data["mail"] == "newmod@example.com"
        assert data["name"] == "New Mod"
        assert data["role"] == "player"
        assert "user_id" in data

    def test_register_user_as_owner_creates_admin_success(self, client, owner_auth_headers):
        payload = {
            "name": "Second Admin",
            "username": "secondadmin",
            "mail": "secondadmin@example.com",
            "password": "SecurePassword123",
            "role": "admin"
        }

        response = client.post("/api/v1/users/register_user", json=payload, headers=owner_auth_headers)

        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "secondadmin"
        assert data["role"] == "admin"

    def test_register_user_admin_cannot_create_owner(self, client, admin_auth_headers):
        payload = {
            "name": "Attempted Owner",
            "username": "attowner",
            "mail": "attowner@example.com",
            "password": "SecurePassword123",
            "role": "owner"
        }

        response = client.post("/api/v1/users/register_user", json=payload, headers=admin_auth_headers)

        assert response.status_code == 401
        assert "is not authorized to register a user with role" in response.json().get("error", "")

    def test_register_user_forbidden_for_player(self, client, player_auth_headers):
        payload = {
            "name": "Unauthorized Attempt",
            "username": "unauthuser",
            "mail": "unauth@example.com",
            "password": "SecurePassword123",
            "role": "player"
        }

        response = client.post("/api/v1/users/register_user", json=payload, headers=player_auth_headers)

        assert response.status_code == 403

    def test_register_user_unauthorized_without_token(self, client):
        payload = {
            "name": "No Token User",
            "username": "notoken",
            "mail": "notoken@example.com",
            "password": "SecurePassword123",
            "role": "player"
        }

        response = client.post("/api/v1/users/register_user", json=payload)

        assert response.status_code == 401

    def test_register_user_duplicate_email(self, client, admin_auth_headers, seed_player):
        payload = {
            "name": "Dupe User",
            "username": "newusername123",
            "mail": seed_player.mail,
            "password": "SecurePassword123",
            "role": "player"
        }

        response = client.post("/api/v1/users/register_user", json=payload, headers=admin_auth_headers)

        assert response.status_code == 409
        assert "Ya existe una cuenta registrada con el email" in response.json().get("error", "")

    def test_register_user_insecure_password(self, client, admin_auth_headers):
        payload = {
            "name": "Weak User",
            "username": "weakadminchild",
            "mail": "weakchild@example.com",
            "password": "123",
            "role": "player"
        }

        response = client.post("/api/v1/users/register_user", json=payload, headers=admin_auth_headers)

        assert response.status_code == 400

    def test_register_user_invalid_role(self, client, admin_auth_headers):
        payload = {
            "name": "Invalid Role User",
            "username": "badroleuser",
            "mail": "badrole@example.com",
            "password": "SecurePassword123",
            "role": "superman"
        }

        response = client.post("/api/v1/users/register_user", json=payload, headers=admin_auth_headers)

        assert response.status_code == 422

    # ---------------------------------------------------------
    # PUT /api/v1/users/ (Update current user)
    # ---------------------------------------------------------

    def test_update_user_success(self, client, player_auth_headers, seed_player):
        file_content = b"fake-user-avatar-image-data"
        file = ("avatar.png", io.BytesIO(file_content), "image/png")

        data = {
            "username": "johnupdated",
            "name": "John Updated",
            "mail": "john.updated@example.com",
        }

        response = client.put(
            "/api/v1/users/",
            data=data,
            files={"icon": file},
            headers=player_auth_headers
        )

        assert response.status_code == 200
        result = response.json()
        assert result["user_id"] == seed_player.user_id
        assert result["username"] == "johnupdated"
        assert result["name"] == "John Updated"
        assert result["mail"] == "john.updated@example.com"
        assert result["icon_url"].startswith("/media/users/icons/")
        assert result["icon_url"].endswith(".png")

    def test_update_user_unauthorized_without_token(self, client):
        data = {
            "username": "hacker",
            "name": "Hacker",
            "mail": "hacker@example.com",
        }
        file = ("avatar.png", io.BytesIO(b"data"), "image/png")

        response = client.put("/api/v1/users/", data=data, files={"icon": file})
        assert response.status_code == 401

    def test_update_user_empty_filename_rejected(self, client, player_auth_headers):
        data = {
            "username": "validname",
            "name": "Valid Name",
            "mail": "valid@example.com",
        }
        file = ("", io.BytesIO(b"data"), "image/png")

        response = client.put(
            "/api/v1/users/",
            data=data,
            files={"icon": file},
            headers=player_auth_headers
        )

        assert response.status_code in [400, 422]

    def test_update_user_duplicate_email_conflict(self, client, player_auth_headers, seed_admin):
        data = {
            "username": "myuniqueusername",
            "name": "My Name",
            "mail": seed_admin.mail,  # belongs to seed_admin
        }
        file = ("icon.png", io.BytesIO(b"data"), "image/png")

        response = client.put(
            "/api/v1/users/",
            data=data,
            files={"icon": file},
            headers=player_auth_headers
        )

        assert response.status_code == 409
        assert "Ya existe una cuenta registrada con el email" in response.json().get("error", "")

    def test_update_user_duplicate_username_conflict(self, client, player_auth_headers, seed_admin):
        data = {
            "username": seed_admin.username,  # belongs to seed_admin
            "name": "My Name",
            "mail": "unique.mail@example.com",
        }
        file = ("icon.png", io.BytesIO(b"data"), "image/png")

        response = client.put(
            "/api/v1/users/",
            data=data,
            files={"icon": file},
            headers=player_auth_headers
        )

        assert response.status_code == 409
        assert "ya está ocupado" in response.json().get("error", "")

    # ---------------------------------------------------------
    # GET /api/v1/users/me
    # ---------------------------------------------------------

    def test_get_user_me_success(self, client, player_auth_headers, seed_player):
        response = client.get("/api/v1/users/me", headers=player_auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["username"] == seed_player.username
        assert data["name"] == seed_player.name
        assert data["mail"] == seed_player.mail
        assert data["role"] == seed_player.role
        assert data["icon_url"] == seed_player.icon_url

    def test_get_user_me_unauthorized(self, client):
        response = client.get("/api/v1/users/me")
        assert response.status_code == 401
