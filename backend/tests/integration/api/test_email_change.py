import hashlib
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock

import pytest

from app.infrastructure.database.models.pending_email_change_orm import PendingEmailChangeORM
from app.infrastructure.database.models.password_reset_token_orm import PasswordResetTokenORM
from app.infrastructure.database.models.user_orm import UserORM
from app.infrastructure.email.resend_email_service import ResendEmailService


@pytest.fixture
def email_change_email(monkeypatch):
    email = AsyncMock()
    monkeypatch.setattr(ResendEmailService, "send_email_change_confirmation_email", email)
    return email


def request_change(client, headers, email, **overrides):
    response = client.post("/api/v1/users/me/email-change", headers=headers, json={
        "mail": "new@example.com", "password": "Password123", **overrides,
    })
    assert response.status_code == 202
    assert set(response.json()) == {"message"}
    return email.await_args.kwargs["raw_token"]


def confirm(client, token):
    return client.post("/auth/v1/confirm-email-change", json={"token": token})


def test_email_changes_only_after_confirmation(
    client, player_auth_headers, seed_player, email_change_email, test_db_session,
):
    token = request_change(client, player_auth_headers, email_change_email, mail="NEW@EXAMPLE.COM")
    assert email_change_email.await_args.kwargs["to_email"] == "new@example.com"
    pending = test_db_session.query(PendingEmailChangeORM).one()
    assert pending.user_id == seed_player.user_id
    assert pending.token_hash == hashlib.sha256(token.encode()).hexdigest()
    test_db_session.refresh(seed_player)
    assert seed_player.mail == "john.doe@example.com"
    assert client.get("/auth/v1/confirm-email-change", params={"token": token}).status_code == 405
    assert client.post("/auth/v1/confirm-registration", json={"token": token}).status_code == 400

    # Guardar otros datos no invalida ni aplica el cambio de correo pendiente.
    profile = client.put("/api/v1/users/", headers=player_auth_headers, data={
        "name": "Updated Name", "username": "updated_name", "mail": "bypass@example.com",
    })
    assert profile.status_code == 200
    assert profile.json()["mail"] == "john.doe@example.com"

    assert confirm(client, token).status_code == 200
    test_db_session.expire_all()
    assert seed_player.mail == "new@example.com"
    assert seed_player.name == "Updated Name"
    assert test_db_session.query(PendingEmailChangeORM).count() == 0
    assert confirm(client, token).status_code == 400
    for mail, status in [("new@example.com", 200), ("john.doe@example.com", 401)]:
        assert client.post("/auth/v1/login", data={"username": mail, "password": "Password123"}).status_code == status


@pytest.mark.parametrize("password", ["wrong-password", None])
def test_requires_correct_current_password(
    client, player_auth_headers, seed_player, email_change_email, test_db_session, password,
):
    if password is None:
        seed_player.password_hash = None
        test_db_session.commit()
    response = client.post("/api/v1/users/me/email-change", headers=player_auth_headers, json={
        "mail": "new@example.com", "password": password or "Password123",
    })
    assert response.status_code == 400
    email_change_email.assert_not_awaited()
    assert test_db_session.query(PendingEmailChangeORM).count() == 0


@pytest.mark.parametrize("body,status", [
    ({"mail": "new@example.com"}, 422),
    ({"mail": "invalid", "password": "Password123"}, 422),
    ({"mail": "new@example.com", "password": ""}, 422),
    ({"mail": "JOHN.DOE@example.com", "password": "Password123"}, 400),
])
def test_validates_request(client, player_auth_headers, email_change_email, body, status):
    assert client.post("/api/v1/users/me/email-change", headers=player_auth_headers, json=body).status_code == status
    email_change_email.assert_not_awaited()


def test_request_requires_authentication(client, email_change_email):
    assert client.post("/api/v1/users/me/email-change", json={
        "mail": "new@example.com", "password": "Password123",
    }).status_code == 401
    email_change_email.assert_not_awaited()


def test_new_request_replaces_previous_link(client, player_auth_headers, email_change_email, test_db_session):
    previous = request_change(client, player_auth_headers, email_change_email)
    previous_id = test_db_session.query(PendingEmailChangeORM).one().pending_email_change_id
    current = request_change(client, player_auth_headers, email_change_email, mail="latest@example.com")
    assert test_db_session.query(PendingEmailChangeORM).count() == 1
    assert test_db_session.query(PendingEmailChangeORM).one().pending_email_change_id == previous_id
    assert confirm(client, previous).status_code == 400
    assert confirm(client, current).status_code == 200


def test_expired_link_cannot_change_email(
    client, player_auth_headers, seed_player, email_change_email, test_db_session,
):
    token = request_change(client, player_auth_headers, email_change_email)
    test_db_session.query(PendingEmailChangeORM).one().expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    test_db_session.commit()
    assert confirm(client, token).status_code == 400
    test_db_session.refresh(seed_player)
    assert seed_player.mail == "john.doe@example.com"


@pytest.mark.parametrize("occupied_before_request", [True, False])
def test_email_uniqueness_checked_on_request_and_confirmation(
    client, player_auth_headers, seed_player, email_change_email, test_db_session, occupied_before_request,
):
    if not occupied_before_request:
        token = request_change(client, player_auth_headers, email_change_email)
    test_db_session.add(UserORM(name="Other", username="other", mail="new@example.com", role="player"))
    test_db_session.commit()
    if occupied_before_request:
        response = client.post("/api/v1/users/me/email-change", headers=player_auth_headers, json={
            "mail": "NEW@example.com", "password": "Password123",
        })
        email_change_email.assert_not_awaited()
    else:
        response = confirm(client, token)
    assert response.status_code == 409
    test_db_session.refresh(seed_player)
    assert seed_player.mail == "john.doe@example.com"


def test_deleted_account_cannot_confirm(client, player_auth_headers, seed_player, email_change_email, test_db_session):
    token = request_change(client, player_auth_headers, email_change_email)
    seed_player.deleted = True
    test_db_session.commit()
    assert confirm(client, token).status_code == 400


@pytest.mark.parametrize("token,status", [("short", 422), ("x" * 43, 400), ("x" * 129, 422)])
def test_invalid_confirmation_tokens(client, token, status):
    assert confirm(client, token).status_code == status


def test_rate_limits_password_attempts(client, player_auth_headers, email_change_email):
    for _ in range(5):
        assert client.post("/api/v1/users/me/email-change", headers=player_auth_headers, json={
            "mail": "new@example.com", "password": "wrong-password",
        }).status_code == 400
    response = client.post("/api/v1/users/me/email-change", headers=player_auth_headers, json={
        "mail": "new@example.com", "password": "Password123",
    })
    assert response.status_code == 429
    assert "retry-after" in response.headers
    email_change_email.assert_not_awaited()


def test_password_reset_invalidates_pending_email_change(
    client, player_auth_headers, seed_player, email_change_email, test_db_session,
):
    email_token = request_change(client, player_auth_headers, email_change_email)
    reset_token = "r" * 43
    test_db_session.add(PasswordResetTokenORM(
        user_id=seed_player.user_id,
        token_hash=hashlib.sha256(reset_token.encode()).hexdigest(),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        is_used=False,
    ))
    test_db_session.commit()
    assert client.post("/auth/v1/reset-password", json={"token": reset_token, "new_password": "NewPassword123"}).status_code == 200
    assert confirm(client, email_token).status_code == 400


def test_email_confirmation_invalidates_password_reset_links(
    client, player_auth_headers, seed_player, email_change_email, test_db_session,
):
    email_token = request_change(client, player_auth_headers, email_change_email)
    reset_token = "r" * 43
    test_db_session.add(PasswordResetTokenORM(
        user_id=seed_player.user_id,
        token_hash=hashlib.sha256(reset_token.encode()).hexdigest(),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        is_used=False,
    ))
    test_db_session.commit()
    assert confirm(client, email_token).status_code == 200
    assert client.post("/auth/v1/reset-password", json={"token": reset_token, "new_password": "NewPassword123"}).status_code == 400
