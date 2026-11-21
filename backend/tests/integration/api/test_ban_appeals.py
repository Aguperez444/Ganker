from datetime import datetime, timedelta, timezone

import jwt
import pytest

from app.infrastructure.api.auth.jwt_ban_appeal_token_service import JwtBanAppealTokenService
from app.infrastructure.config.settings import settings
from app.infrastructure.database.models.ban_appeal_orm import BanAppealORM, BanAppealImageORM
from app.infrastructure.database.models.user_ban_record_orm import UserBanRecordORM

URL = "/api/v1/ban-appeals"
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32


@pytest.fixture
def banned_player(client, seed_player, admin_auth_headers, test_db_session):
    response = client.post("/api/v1/moderation/ban", json={
        "player_id": seed_player.user_id, "reason": "Uso de scripts", "duration_days": 7,
    }, headers=admin_auth_headers)
    assert response.status_code == 200
    login = client.post("/auth/v1/login", data={"username": seed_player.mail, "password": "Password123"})
    assert login.status_code == 400
    assert login.json()["code"] == "ACCOUNT_BANNED"
    assert login.headers["cache-control"] == "no-store"
    token = login.json()["appeal_token"]
    return {"Authorization": f"Bearer {token}"}


def submit(client, headers, text="Considero que fue un error", files=None):
    return client.post(f"{URL}/mine", data={"text": text}, files=files, headers=headers)


def test_banned_player_submits_text_and_multiple_images_and_can_read_own_appeal(
    client, banned_player, seed_player, test_db_session, admin_auth_headers,
):
    before = client.get(f"{URL}/mine", headers=banned_player)
    assert before.status_code == 200
    assert before.json()["appeal"] is None
    assert before.json()["ban"]["active"] is True
    response = submit(client, banned_player, text="  No utilicé scripts.\nAdjunto pruebas.  ", files=[
        ("images", ("uno.png", PNG, "image/png")), ("images", ("dos.png", PNG, "image/png")),
    ])
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["text"] == "No utilicé scripts.\nAdjunto pruebas."
    assert data["status"] == "pending"
    assert data["ban"]["user_id"] == seed_player.user_id
    assert len(data["images"]) == 2
    assert test_db_session.query(BanAppealImageORM).count() == 2
    assert client.get(data["images"][0]).content == PNG
    assert client.get(f"{URL}/mine", headers=banned_player).json()["appeal"]["id"] == data["id"]
    detail = client.get(f"{URL}/{data['id']}", headers=admin_auth_headers)
    assert detail.status_code == 200
    assert detail.json()["images"] == data["images"]


def test_duplicate_appeal_is_rejected_without_writing_more_images(client, banned_player, test_db_session):
    assert submit(client, banned_player).status_code == 201
    second = submit(client, banned_player, files=[("images", ("extra.png", PNG, "image/png"))])
    assert second.status_code == 409
    assert test_db_session.query(BanAppealORM).count() == 1
    assert test_db_session.query(BanAppealImageORM).count() == 0
    assert not (settings.media_dir / "appeals").exists()


@pytest.mark.parametrize("text", ["", "   ", "x" * 3001])
def test_appeal_requires_nonempty_bounded_text(client, banned_player, test_db_session, text):
    assert submit(client, banned_player, text=text).status_code == 422
    assert test_db_session.query(BanAppealORM).count() == 0


@pytest.mark.parametrize("files,status", [
    ([("images", (f"{i}.png", PNG, "image/png")) for i in range(4)], 422),
    ([("images", ("large.png", PNG + b"x" * (2 * 1024 * 1024), "image/png"))], 413),
    ([("images", ("evil.html", b"<script>bad</script>", "text/html"))], 422),
    ([("images", ("fake.png", b"<script>bad</script>", "image/png"))], 400),
    ([("images", ("valid.png", PNG, "image/png")), ("images", ("fake.png", b"not an image", "image/png"))], 400),
])
def test_invalid_images_leave_no_appeal_or_orphan_files(client, banned_player, test_db_session, files, status):
    response = submit(client, banned_player, files=files)
    assert response.status_code == status, response.text
    assert test_db_session.query(BanAppealORM).count() == 0
    assert test_db_session.query(BanAppealImageORM).count() == 0
    assert not list(settings.media_dir.glob("appeals/evidence/*"))


def test_appeal_permission_cannot_access_account_admin_or_refresh(client, banned_player):
    token = banned_player["Authorization"].removeprefix("Bearer ")
    assert client.get("/api/v1/users/me", headers=banned_player).status_code == 401
    assert client.get(URL, headers=banned_player).status_code == 401
    assert client.post("/auth/v1/refresh", json={"refresh_token": token}).status_code == 401


def test_regular_player_token_cannot_submit_or_list_appeals(client, player_auth_headers):
    assert submit(client, player_auth_headers).status_code == 401
    assert client.get(URL, headers=player_auth_headers).status_code == 403
    assert client.get(f"{URL}/1", headers=player_auth_headers).status_code == 403


def test_invalid_credentials_do_not_receive_appeal_permission(client, banned_player, seed_player):
    response = client.post("/auth/v1/login", data={"username": seed_player.mail, "password": "incorrect"})
    assert response.status_code == 401
    assert "appeal_token" not in response.json()


@pytest.mark.parametrize("decision", ["accepted", "rejected"])
def test_admin_resolves_once_records_audit_and_only_acceptance_unbans(
    client, banned_player, admin_auth_headers, seed_player, seed_admin, test_db_session, decision,
):
    appeal = submit(client, banned_player).json()
    response = client.post(f"{URL}/{appeal['id']}/resolve", json={"decision": decision}, headers=admin_auth_headers)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] == decision
    assert data["resolved_at"]
    assert data["resolver_user_id"] == seed_admin.user_id
    assert data["resolver_username"] == seed_admin.username
    test_db_session.expire_all()
    assert seed_player.banned is (decision == "rejected")
    repeated = client.post(f"{URL}/{appeal['id']}/resolve", json={"decision": "accepted"}, headers=admin_auth_headers)
    assert repeated.status_code == 409
    own = client.get(f"{URL}/mine", headers=banned_player)
    assert own.json()["appeal"]["status"] == decision
    if decision == "accepted":
        login = client.post("/auth/v1/login", data={"username": seed_player.mail, "password": "Password123"})
        assert login.status_code == 200


def test_expired_or_replaced_ban_cannot_be_appealed_or_lifted_from_old_appeal(
    client, banned_player, seed_player, admin_auth_headers, test_db_session,
):
    appeal = submit(client, banned_player).json()
    # Una nueva sanción invalida el permiso y la resolución de la anterior.
    assert client.post("/api/v1/moderation/ban", json={
        "player_id": seed_player.user_id, "reason": "Otra sanción", "duration_days": 30,
    }, headers=admin_auth_headers).status_code == 200
    assert submit(client, banned_player).status_code == 409
    response = client.post(f"{URL}/{appeal['id']}/resolve", json={"decision": "accepted"}, headers=admin_auth_headers)
    assert response.status_code == 409
    test_db_session.expire_all()
    assert seed_player.banned is True
    assert test_db_session.query(BanAppealORM).one().status == "pending"


def test_expired_ban_rejects_new_appeal(client, banned_player, test_db_session):
    ban = test_db_session.query(UserBanRecordORM).one()
    ban.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    test_db_session.commit()
    assert submit(client, banned_player).status_code == 409


def test_appeal_token_is_bound_to_owner_and_expires(client, banned_player, seed_admin, test_db_session):
    token = banned_player["Authorization"].removeprefix("Bearer ")
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"], audience="ban-appeal")
    payload["sub"] = str(seed_admin.user_id)
    wrong_owner = jwt.encode(payload, settings.jwt_secret_key, algorithm="HS256")
    assert client.get(f"{URL}/mine", headers={"Authorization": f"Bearer {wrong_owner}"}).status_code == 404
    payload["exp"] = datetime.now(timezone.utc) - timedelta(seconds=1)
    expired = jwt.encode(payload, settings.jwt_secret_key, algorithm="HS256")
    assert submit(client, {"Authorization": f"Bearer {expired}"}).status_code == 401


def test_admin_search_includes_only_appealed_bans_and_filters_status(client, banned_player, admin_auth_headers):
    appeal = submit(client, banned_player).json()
    response = client.get(URL, headers=admin_auth_headers, params={"username": "john", "status": "pending", "limit": 1})
    assert response.status_code == 200
    assert [row["id"] for row in response.json()["appeals"]] == [appeal["id"]]
    assert client.get(URL, headers=admin_auth_headers, params={"skip": 1}).json()["appeals"] == []
    assert client.get(URL, headers=admin_auth_headers, params={"status": "accepted"}).json()["appeals"] == []


def test_deleted_player_cannot_submit_or_be_listed(client, banned_player, seed_player, admin_auth_headers, test_db_session):
    submit(client, banned_player)
    seed_player.deleted = True
    test_db_session.commit()
    assert client.get(f"{URL}/mine", headers=banned_player).status_code == 404
    assert client.get(URL, headers=admin_auth_headers).json()["appeals"] == []
