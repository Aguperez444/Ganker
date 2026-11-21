from datetime import datetime, timedelta, timezone

import pytest

from app.infrastructure.database.models.user_ban_record_orm import UserBanRecordORM
from app.infrastructure.database.models.user_orm import UserORM

PREFIX = "/api/v1/moderation"


def apply_ban(client, headers, player_id, days=7, reason="Uso de scripts"):
    response = client.post(f"{PREFIX}/ban", json={
        "player_id": player_id, "duration_days": days, "reason": reason,
    }, headers=headers)
    assert response.status_code == 200


def test_ban_detail_preserves_expiration_and_tracks_manual_unban_actor(
    client, seed_player, seed_admin, admin_auth_headers, test_db_session,
):
    apply_ban(client, admin_auth_headers, seed_player.user_id)
    ban = test_db_session.query(UserBanRecordORM).one()
    expiration = ban.expires_at
    endpoint = f"{PREFIX}/banned-players/{ban.id}"
    active = client.get(endpoint, headers=admin_auth_headers)
    assert active.status_code == 200
    assert active.json()["status"] == "active"
    assert active.json()["banned_by_user_id"] == seed_admin.user_id
    assert active.json()["banned_by_username"] == seed_admin.username
    assert active.json()["appeal"] is None
    assert client.post(f"{PREFIX}/{seed_player.user_id}/unban", headers=admin_auth_headers).status_code == 200
    detail = client.get(endpoint, headers=admin_auth_headers).json()
    assert detail["status"] == "unbanned"
    assert detail["end_reason"] == "manual"
    assert detail["ended_by_user_id"] == seed_admin.user_id
    assert detail["ended_by_username"] == seed_admin.username
    assert detail["ended_at"]
    test_db_session.expire_all()
    assert ban.expires_at == expiration
    assert ban.ended_at < ban.expires_at
    rows = client.get(f"{PREFIX}/banned-players", headers=admin_auth_headers).json()["list_banned_players"]
    assert datetime.fromisoformat(rows[0]["date_expire"]).replace(tzinfo=None) == ban.ended_at.replace(tzinfo=None)
    assert client.get(f"{PREFIX}/banned-players/active", headers=admin_auth_headers).json()["players"] == []


def test_expiration_detail_is_correct_before_login_and_records_actual_deadline(
    client, seed_player, seed_admin, admin_auth_headers, test_db_session,
):
    expiration = datetime.now(timezone.utc) - timedelta(days=2)
    seed_player.banned = True
    ban = UserBanRecordORM(banned_user_id=seed_player.user_id, banned_by_user_id=seed_admin.user_id,
                          reason="Spam", created_at=expiration - timedelta(days=7), expires_at=expiration)
    test_db_session.add(ban)
    test_db_session.commit()
    detail = client.get(f"{PREFIX}/banned-players/{ban.id}", headers=admin_auth_headers).json()
    assert detail["status"] == "expired"
    assert detail["end_reason"] == "expired"
    assert detail["ended_at"] == detail["expires_at"]
    assert detail["ended_by_user_id"] is None
    login = client.post("/auth/v1/login", data={"username": seed_player.mail, "password": "Password123"})
    assert login.status_code == 200
    test_db_session.expire_all()
    assert ban.end_reason == "expired"
    assert ban.ended_at.replace(tzinfo=timezone.utc) == expiration
    assert seed_player.banned is False


def test_accepted_appeal_is_attached_to_exact_ban_with_unban_audit(
    client, seed_player, seed_admin, admin_auth_headers, test_db_session,
):
    apply_ban(client, admin_auth_headers, seed_player.user_id)
    ban = test_db_session.query(UserBanRecordORM).one()
    expiration = ban.expires_at
    login = client.post("/auth/v1/login", data={"username": seed_player.mail, "password": "Password123"})
    headers = {"Authorization": f"Bearer {login.json()['appeal_token']}"}
    appeal = client.post("/api/v1/ban-appeals/mine", data={"text": "Apelo esta sanción"}, headers=headers).json()
    resolved = client.post(f"/api/v1/ban-appeals/{appeal['id']}/resolve", json={"decision": "accepted"}, headers=admin_auth_headers)
    assert resolved.status_code == 200
    detail = client.get(f"{PREFIX}/banned-players/{ban.id}", headers=admin_auth_headers).json()
    assert detail["status"] == "unbanned"
    assert detail["end_reason"] == "appeal"
    assert detail["ended_by_user_id"] == seed_admin.user_id
    assert detail["appeal"]["id"] == appeal["id"]
    assert detail["appeal"]["status"] == "accepted"
    test_db_session.expire_all()
    assert ban.expires_at == expiration


def test_previous_ban_history_uses_exact_user_and_excludes_current_and_later_bans(
    client, seed_player, seed_admin, admin_auth_headers, test_db_session,
):
    other = UserORM(username="johndoe_similar", name="Other", role="player")
    test_db_session.add(other)
    test_db_session.commit()
    apply_ban(client, admin_auth_headers, seed_player.user_id, reason="Primera sanción")
    first_id = test_db_session.query(UserBanRecordORM).one().id
    client.post(f"{PREFIX}/{seed_player.user_id}/unban", headers=admin_auth_headers)
    apply_ban(client, admin_auth_headers, other.user_id)
    apply_ban(client, admin_auth_headers, seed_player.user_id, reason="Sanción apelada")
    pivot_id = test_db_session.query(UserBanRecordORM.id).filter_by(banned_user_id=seed_player.user_id).order_by(UserBanRecordORM.id.desc()).first().id
    apply_ban(client, admin_auth_headers, seed_player.user_id, reason="Sanción posterior")
    endpoint = f"{PREFIX}/players/{seed_player.user_id}/bans"
    response = client.get(endpoint, params={"before_ban_id": pivot_id}, headers=admin_auth_headers)
    assert response.status_code == 200
    assert [row["id"] for row in response.json()["bans"]] == [first_id]
    assert response.json()["bans"][0]["status"] == "unbanned"
    assert response.json()["bans"][0]["ended_by_username"] == seed_admin.username
    assert client.get(endpoint, params={"before_ban_id": pivot_id, "skip": 1}, headers=admin_auth_headers).json()["bans"] == []
    assert client.get(f"{PREFIX}/players/{other.user_id}/bans", params={"before_ban_id": pivot_id}, headers=admin_auth_headers).status_code == 404
    pivot = client.get(f"{PREFIX}/banned-players/{pivot_id}", headers=admin_auth_headers).json()
    assert pivot["status"] == "superseded"
    assert pivot["end_reason"] == "superseded"


def test_legacy_unknown_unban_does_not_claim_automatic_expiration(client, seed_player, seed_admin, admin_auth_headers, test_db_session):
    ban = UserBanRecordORM(banned_user_id=seed_player.user_id, banned_by_user_id=seed_admin.user_id,
                          reason="Histórica", expires_at=datetime.now(timezone.utc) - timedelta(days=1), end_reason="unknown")
    test_db_session.add(ban)
    test_db_session.commit()
    response = client.get(f"{PREFIX}/banned-players/{ban.id}", headers=admin_auth_headers)
    assert response.json()["status"] == "unknown"
    assert response.json()["ended_by_user_id"] is None


def test_detail_rejects_non_admin_and_deleted_users(client, seed_player, seed_admin, player_auth_headers, admin_auth_headers, test_db_session):
    apply_ban(client, admin_auth_headers, seed_player.user_id)
    ban = test_db_session.query(UserBanRecordORM).one()
    # Un jugador distinto conserva un token válido, sin estar baneado.
    other = UserORM(username="another", name="Another", role="player")
    test_db_session.add(other)
    test_db_session.commit()
    from app.infrastructure.api.auth.jwt_token_service import JwtTokenService
    from app.infrastructure.config.settings import settings
    token, *_ = JwtTokenService(settings.jwt_secret_key).generate_tokens(other.user_id, "player")
    headers = {"Authorization": f"Bearer {token}"}
    assert client.get(f"{PREFIX}/banned-players/{ban.id}", headers=headers).status_code == 403
    assert client.get(f"{PREFIX}/players/{seed_player.user_id}/bans", headers=headers).status_code == 403
    seed_player.deleted = True
    test_db_session.commit()
    assert client.get(f"{PREFIX}/banned-players/{ban.id}", headers=admin_auth_headers).status_code == 404


@pytest.mark.parametrize("query", [{"skip": -1}, {"limit": 0}, {"limit": 101}, {"before_ban_id": 0}])
def test_history_validates_pagination(client, seed_player, admin_auth_headers, query):
    assert client.get(f"{PREFIX}/players/{seed_player.user_id}/bans", params=query, headers=admin_auth_headers).status_code == 422
