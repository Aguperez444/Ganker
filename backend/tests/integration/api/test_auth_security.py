from datetime import datetime, timedelta, timezone
import hashlib
from unittest.mock import AsyncMock

import pytest

from app.infrastructure.email.resend_email_service import ResendEmailService
from app.infrastructure.database.models.password_reset_token_orm import PasswordResetTokenORM


@pytest.fixture
def reset_email(monkeypatch):
    sender = AsyncMock()
    monkeypatch.setattr(ResendEmailService, "send_password_reset_email", sender)
    return sender


@pytest.mark.parametrize("header", ["CF-Connecting-IP", "X-Real-IP", "X-Forwarded-For"])
def test_login_cannot_bypass_ip_limit_with_spoofed_headers(client, header):
    for attempt in range(6):
        response = client.post(
            "/auth/v1/login",
            data={"username": f"unknown{attempt}@example.com", "password": "WrongPassword1"},
            headers={header: f"203.0.113.{attempt + 1}"},
        )
        assert response.status_code == (401 if attempt < 5 else 429)
    assert int(response.headers["Retry-After"]) > 0


def test_login_unknown_email_wrong_password_and_federated_account_match(client, seed_player, test_db_session):
    unknown = client.post("/auth/v1/login", data={
        "username": "unknown@example.com", "password": "WrongPassword1",
    })
    wrong = client.post("/auth/v1/login", data={
        "username": seed_player.mail, "password": "WrongPassword1",
    })
    seed_player.password_hash = None
    test_db_session.commit()
    federated = client.post("/auth/v1/login", data={
        "username": seed_player.mail, "password": "WrongPassword1",
    })
    assert unknown.status_code == wrong.status_code == federated.status_code == 401
    assert unknown.json() == wrong.json() == federated.json()
    assert seed_player.mail not in wrong.text


def test_forgot_password_limits_ip_before_creating_tokens_or_sending_mail(client, seed_player, reset_email):
    for attempt in range(4):
        response = client.post(
            "/auth/v1/forgot-password",
            json={"email": seed_player.mail if attempt in (0, 3) else f"unknown{attempt}@example.com"},
            headers={"CF-Connecting-IP": f"203.0.113.{attempt + 1}"},
        )
        assert response.status_code == (200 if attempt < 3 else 429)
    assert int(response.headers["Retry-After"]) > 0
    assert reset_email.await_count == 1
    # Rechazar el cuarto pedido no invalida el enlace ya enviado.
    raw_token = reset_email.call_args.kwargs["raw_token"]
    assert client.post("/auth/v1/reset-password", json={
        "token": raw_token, "new_password": "NewPassword123",
    }).status_code == 200


@pytest.mark.parametrize("registered", [True, False])
def test_forgot_password_limits_email_across_connections(client, seed_player, reset_email, registered):
    mail = seed_player.mail if registered else "unknown@example.com"
    for attempt in range(4):
        client._transport.client = (f"203.0.113.{attempt + 1}", 50000)
        response = client.post("/auth/v1/forgot-password", json={"email": mail})
        assert response.status_code == (200 if attempt < 3 else 429)
    assert reset_email.await_count == (3 if registered else 0)


def test_forgot_password_keeps_generic_response_and_separate_login_limit(client, seed_player, reset_email):
    existing = client.post("/auth/v1/forgot-password", json={"email": seed_player.mail})
    missing = client.post("/auth/v1/forgot-password", json={"email": "unknown@example.com"})
    assert existing.status_code == missing.status_code == 200
    assert existing.json() == missing.json()
    client.post("/auth/v1/forgot-password", json={"email": "other@example.com"})
    assert client.post("/auth/v1/forgot-password", json={"email": seed_player.mail}).status_code == 429
    assert client.post("/auth/v1/login", data={
        "username": seed_player.mail, "password": "Password123",
    }).status_code == 200


def test_reset_password_revokes_all_sessions_but_preserves_other_users(
    client, seed_player, seed_admin, test_db_session, reset_email,
):
    player_sessions = [client.post("/auth/v1/login", data={
        "username": seed_player.mail, "password": "Password123",
    }).json()["refresh_token"] for _ in range(2)]
    admin_session = client.post("/auth/v1/login", data={
        "username": seed_admin.mail, "password": "AdminPass123",
    }).json()["refresh_token"]
    assert client.post("/auth/v1/forgot-password", json={"email": seed_player.mail}).status_code == 200
    raw_token = reset_email.call_args.kwargs["raw_token"]
    payload = {"token": raw_token, "new_password": "NewPassword123"}
    assert client.post("/auth/v1/reset-password", json=payload).status_code == 200
    for token in player_sessions:
        assert client.post("/auth/v1/refresh", json={"refresh_token": token}).status_code == 401
    assert client.post("/auth/v1/refresh", json={"refresh_token": admin_session}).status_code == 200
    assert client.post("/auth/v1/reset-password", json=payload).status_code == 400
    assert client.post("/auth/v1/login", data={
        "username": seed_player.mail, "password": "Password123",
    }).status_code == 401
    assert client.post("/auth/v1/login", data={
        "username": seed_player.mail, "password": "NewPassword123",
    }).status_code == 200


def test_expired_reset_token_does_not_revoke_session(client, seed_player, test_db_session):
    refresh_token = client.post("/auth/v1/login", data={
        "username": seed_player.mail, "password": "Password123",
    }).json()["refresh_token"]
    raw_token = "expired-reset-token-" + "x" * 32
    test_db_session.add(PasswordResetTokenORM(
        user_id=seed_player.user_id,
        token_hash=hashlib.sha256(raw_token.encode()).hexdigest(),
        expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
        is_used=False,
    ))
    test_db_session.commit()
    response = client.post("/auth/v1/reset-password", json={
        "token": raw_token, "new_password": "NewPassword123",
    })
    assert response.status_code == 400
    assert client.post("/auth/v1/refresh", json={"refresh_token": refresh_token}).status_code == 200
