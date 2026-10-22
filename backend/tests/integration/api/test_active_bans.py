from datetime import datetime, timedelta, timezone

import pytest
from freezegun import freeze_time

from app.infrastructure.database.models.user_ban_record_orm import UserBanRecordORM
from app.infrastructure.database.models.user_orm import UserORM


ACTIVE_BANS_URL = "/api/v1/moderation/banned-players/active"


def _banned_user(session, username, *, banned=True, deleted=False):
    user = UserORM(
        name=username, username=username, role="player", banned=banned, deleted=deleted,
    )
    session.add(user)
    session.flush()
    return user


def _ban(session, user, expires_at, reason="Abuso"):
    record = UserBanRecordORM(
        banned_user_id=user.user_id, banned_by_user_id=None,
        reason=reason, expires_at=expires_at,
    )
    session.add(record)
    session.flush()
    return record


@freeze_time("2026-10-22 12:00:00")
def test_active_bans_only_returns_latest_current_bans(
    client, jwt_service, seed_admin, test_db_session,
):
    token, *_ = jwt_service.generate_tokens(seed_admin.user_id, "admin")
    admin_auth_headers = {"Authorization": f"Bearer {token}"}
    now = datetime.now(timezone.utc)
    future = now + timedelta(days=2)
    past = now - timedelta(days=1)
    active = _banned_user(test_db_session, "active")
    _ban(test_db_session, active, past, "Anterior")
    _ban(test_db_session, active, future, "Motivo vigente")
    permanent = _banned_user(test_db_session, "permanent")
    _ban(test_db_session, permanent, None)
    for name, banned, deleted, expiration in [
        ("expired", True, False, past),
        ("expires_now", True, False, now),
        ("manually_unbanned", False, False, future),
        ("deleted_user", True, True, future),
    ]:
        user = _banned_user(test_db_session, name, banned=banned, deleted=deleted)
        _ban(test_db_session, user, expiration)
    latest_expired = _banned_user(test_db_session, "latest_expired")
    _ban(test_db_session, latest_expired, future)
    _ban(test_db_session, latest_expired, past)
    test_db_session.commit()

    response = client.get(ACTIVE_BANS_URL, headers=admin_auth_headers)

    assert response.status_code == 200
    players = response.json()["players"]
    assert [p["user_id"] for p in players] == [active.user_id, permanent.user_id]
    assert players[0]["username"] == "active"
    assert players[0]["reason"] == "Motivo vigente"
    assert datetime.fromisoformat(players[0]["expires_at"]).replace(tzinfo=timezone.utc) == future
    assert players[1]["expires_at"] is None
    assert set(players[0]) == {"user_id", "username", "reason", "expires_at"}


def test_active_bans_filters_before_pagination(client, admin_auth_headers, test_db_session):
    for name in ["unrelated", "Toxic_alpha", "toxic_beta", "toxic_gamma", "toxic_%"]:
        user = _banned_user(test_db_session, name)
        _ban(test_db_session, user, None)
    test_db_session.commit()

    response = client.get(ACTIVE_BANS_URL, headers=admin_auth_headers, params={
        "username": " TOXIC_ ", "skip": 1, "limit": 1,
    })
    assert response.status_code == 200
    assert [p["username"] for p in response.json()["players"]] == ["toxic_beta"]
    literal = client.get(ACTIVE_BANS_URL, headers=admin_auth_headers, params={"username": "%"})
    assert [p["username"] for p in literal.json()["players"]] == ["toxic_%"]
    empty = client.get(ACTIVE_BANS_URL, headers=admin_auth_headers, params={"skip": 100})
    assert empty.json() == {"players": []}


@pytest.mark.parametrize("params", [{"skip": -1}, {"limit": 0}, {"limit": 101}])
def test_active_bans_validates_pagination(client, admin_auth_headers, params):
    assert client.get(ACTIVE_BANS_URL, headers=admin_auth_headers, params=params).status_code == 422


def test_active_bans_requires_moderator(client, player_auth_headers, owner_auth_headers):
    assert client.get(ACTIVE_BANS_URL).status_code == 401
    assert client.get(ACTIVE_BANS_URL, headers=player_auth_headers).status_code == 403
    response = client.get(ACTIVE_BANS_URL, headers=owner_auth_headers)
    assert response.status_code == 200
    assert response.json() == {"players": []}


@pytest.mark.parametrize("permanent", [False, True])
def test_banned_login_returns_latest_reason_and_expiration(
    client, seed_player, test_db_session, permanent,
):
    seed_player.banned = True
    _ban(test_db_session, seed_player, datetime.now(timezone.utc) + timedelta(days=1), "Anterior")
    expiration = None if permanent else datetime.now(timezone.utc) + timedelta(days=5)
    latest = _ban(test_db_session, seed_player, expiration, "Insultos reiterados")
    test_db_session.commit()
    test_db_session.refresh(latest)

    response = client.post("/auth/v1/login", data={
        "username": seed_player.mail, "password": "Password123",
    })

    assert response.status_code == 400
    data = response.json()
    assert data["reason"] == "Insultos reiterados"
    assert data["expires_at"] == (latest.expires_at.isoformat() if latest.expires_at else None)
    assert "Insultos reiterados" in data["error"]
    assert (latest.expires_at.isoformat() if latest.expires_at else "Sin fecha de vencimiento") in data["error"]
    assert "access_token" not in data


def test_wrong_password_does_not_disclose_ban(client, seed_player, test_db_session):
    seed_player.banned = True
    _ban(test_db_session, seed_player, None, "Motivo privado")
    test_db_session.commit()

    response = client.post("/auth/v1/login", data={
        "username": seed_player.mail, "password": "WrongPassword123",
    })

    assert response.status_code == 401
    assert "reason" not in response.json()
    assert "expires_at" not in response.json()
    assert "Motivo privado" not in response.text
