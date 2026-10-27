import hashlib
from datetime import datetime, timedelta, timezone

import pytest

from app.infrastructure.database.models.pending_registration_orm import PendingRegistrationORM
from app.infrastructure.database.models.user_orm import UserORM
from app.infrastructure.database.models.refresh_token_orm import RefreshTokenORM


REGISTRATION = {
    "name": "Juan Pérez", "username": "juancito123",
    "mail": "juan@example.com", "password": "Password123",
}


def request_registration(client, registration_email, **overrides):
    response = client.post("/api/v1/users/register", json=REGISTRATION | overrides)
    assert response.status_code == 202
    assert set(response.json()) == {"message"}
    return registration_email.await_args.kwargs["raw_token"]


def confirm(client, token):
    return client.post("/auth/v1/confirm-registration", json={"token": token})


def test_registration_creates_account_only_after_email_confirmation(
    client, registration_email, test_db_session, password_hasher,
):
    token = request_registration(client, registration_email, mail="Juan@EXAMPLE.COM")

    assert registration_email.await_args.kwargs["to_email"] == "juan@example.com"
    pending = test_db_session.query(PendingRegistrationORM).one()
    assert pending.token_hash == hashlib.sha256(token.encode()).hexdigest()
    assert pending.password_hash != REGISTRATION["password"]
    assert password_hasher.verify_password(REGISTRATION["password"], pending.password_hash)
    assert test_db_session.query(UserORM).count() == 0
    assert test_db_session.query(RefreshTokenORM).count() == 0
    assert client.post("/auth/v1/login", data={
        "username": REGISTRATION["mail"], "password": REGISTRATION["password"],
    }).status_code == 401

    response = confirm(client, token)
    assert response.status_code == 200
    assert set(response.json()) == {"message"}
    test_db_session.expire_all()
    user = test_db_session.query(UserORM).one()
    assert user.username == REGISTRATION["username"]
    assert user.mail == "juan@example.com"
    assert user.role == "player"
    assert test_db_session.query(PendingRegistrationORM).count() == 0
    assert client.post("/auth/v1/login", data={
        "username": REGISTRATION["mail"], "password": REGISTRATION["password"],
    }).status_code == 200
    assert confirm(client, token).status_code == 400


def test_expired_confirmation_cannot_create_user(client, registration_email, test_db_session):
    token = request_registration(client, registration_email)
    pending = test_db_session.query(PendingRegistrationORM).one()
    pending.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    test_db_session.commit()

    assert confirm(client, token).status_code == 400
    assert test_db_session.query(UserORM).count() == 0


@pytest.mark.parametrize("body,status", [
    ({}, 422), ({"token": "short"}, 422), ({"token": "x" * 129}, 422),
    ({"token": "x" * 43}, 400),
])
def test_confirmation_rejects_invalid_tokens(client, body, status):
    assert client.post("/auth/v1/confirm-registration", json=body).status_code == status


def test_resend_rotates_token_and_renews_expiration(client, registration_email, test_db_session):
    old_token = request_registration(client, registration_email)
    pending = test_db_session.query(PendingRegistrationORM).one()
    pending.expires_at = datetime.now(timezone.utc) - timedelta(days=1)
    test_db_session.commit()

    response = client.post("/auth/v1/resend-registration", json={"email": "JUAN@example.com"})
    assert response.status_code == 200
    new_token = registration_email.await_args.kwargs["raw_token"]
    assert new_token != old_token
    assert confirm(client, old_token).status_code == 400
    assert confirm(client, new_token).status_code == 200


def test_repeating_registration_replaces_pending_details_and_invalidates_old_link(
    client, registration_email, test_db_session, password_hasher,
):
    old_token = request_registration(client, registration_email)
    pending_id = test_db_session.query(PendingRegistrationORM).one().registration_id
    new_token = request_registration(client, registration_email, username="juanpro", password="NewPassword123")

    assert test_db_session.query(PendingRegistrationORM).count() == 1
    assert test_db_session.query(PendingRegistrationORM).one().registration_id == pending_id
    assert confirm(client, old_token).status_code == 400
    assert confirm(client, new_token).status_code == 200
    user = test_db_session.query(UserORM).one()
    assert user.username == "juanpro"
    assert password_hasher.verify_password("NewPassword123", user.password_hash)


@pytest.mark.parametrize("field", ["mail", "username"])
def test_confirmation_rechecks_uniqueness(client, registration_email, test_db_session, field):
    token = request_registration(client, registration_email)
    user_data = {"mail": "other@example.com", "username": "other", field: REGISTRATION[field]}
    test_db_session.add(UserORM(name="Otro", role="player", **user_data))
    test_db_session.commit()

    assert confirm(client, token).status_code == 409
    assert test_db_session.query(UserORM).count() == 1
    assert test_db_session.query(PendingRegistrationORM).count() == 1


def test_resend_does_not_disclose_accounts_or_create_users(client, registration_email, seed_player):
    missing = client.post("/auth/v1/resend-registration", json={"email": "missing@example.com"})
    existing = client.post("/auth/v1/resend-registration", json={"email": seed_player.mail})

    assert missing.status_code == existing.status_code == 200
    assert missing.json() == existing.json()
    registration_email.assert_not_awaited()


def test_registration_and_resend_share_rate_limit(client, registration_email):
    request_registration(client, registration_email)
    for _ in range(2):
        assert client.post("/auth/v1/resend-registration", json={"email": REGISTRATION["mail"]}).status_code == 200
    blocked = client.post("/api/v1/users/register", json=REGISTRATION)

    assert blocked.status_code == 429
    assert "retry-after" in blocked.headers
    assert registration_email.await_count == 3


def test_registration_limits_email_across_ips(client, registration_email):
    for i in range(3):
        client._transport.client = (f"192.0.2.{i + 1}", 50000)
        request_registration(client, registration_email)
    client._transport.client = ("192.0.2.100", 50000)
    assert client.post("/auth/v1/resend-registration", json={"email": "JUAN@example.com"}).status_code == 429


def test_opening_link_does_not_confirm_account(client, registration_email, test_db_session):
    token = request_registration(client, registration_email)
    assert client.get("/auth/v1/confirm-registration", params={"token": token}).status_code == 405
    assert test_db_session.query(UserORM).count() == 0
