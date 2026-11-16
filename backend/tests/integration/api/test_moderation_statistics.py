from datetime import datetime, timedelta, timezone

import pytest

from app.domain.models.report_reason import ReportReason
from app.domain.models.report_status import ReportStatus
from app.infrastructure.database.models import PlayerReportORM, UserORM, UserBanRecordORM
from app.infrastructure.database.models.ban_appeal_orm import BanAppealORM


URL = "/api/v1/reports/moderation-summary"
NOW = datetime(2026, 11, 16, 12, tzinfo=timezone.utc)
START = NOW - timedelta(days=10)


@pytest.fixture(autouse=True)
def statistics_clock(monkeypatch):
    import app.application.use_cases.query_moderation_statistics as module

    class Clock(datetime):
        @classmethod
        def now(cls, tz=None):
            return NOW

    monkeypatch.setattr(module, "datetime", Clock)


def add_report(session, reporter, target, created=START, **kwargs):
    row = PlayerReportORM(reporter_id=reporter.user_id, reported_id=target.user_id,
                          created_at=created, reason=kwargs.pop("reason", ReportReason.CHEATING),
                          status=kwargs.pop("status", ReportStatus.PENDING), **kwargs)
    session.add(row)
    session.flush()
    return row


def add_ban(session, target, created=START, **kwargs):
    row = UserBanRecordORM(banned_user_id=target.user_id, reason="Moderación", created_at=created, **kwargs)
    session.add(row)
    session.flush()
    return row


def test_report_counts_games_rankings_and_creation_boundaries(
    client, test_db_session, admin_auth_headers, seed_player, seed_catalog_data,
):
    second = UserORM(name="Otra cuenta", username="otra", role="player")
    deleted = UserORM(name="Eliminada", username="nombre-privado", role="player", deleted=True)
    test_db_session.add_all([second, deleted])
    test_db_session.flush()
    game = seed_catalog_data["videogame"]
    add_report(test_db_session, second, seed_player, videogame_id=game.videogame_id, evidence_image_url="/media/proof.png")
    add_report(test_db_session, second, seed_player, status=ReportStatus.RESOLVED, evidence_video_url="https://youtube.com/watch?v=dQw4w9WgXcQ")
    add_report(test_db_session, deleted, seed_player, status=ReportStatus.REJECTED, reason=ReportReason.OTHER)
    add_report(test_db_session, seed_player, deleted, created=NOW - timedelta(microseconds=1))
    # Antes del inicio, exactamente en el final exclusivo y datos futuros.
    add_report(test_db_session, second, seed_player, START - timedelta(microseconds=1))
    add_report(test_db_session, second, seed_player, NOW)
    add_report(test_db_session, second, seed_player, NOW + timedelta(days=1))
    test_db_session.commit()
    response = client.get(URL, params={"start_date": START.isoformat(), "end_date": NOW.isoformat()}, headers=admin_auth_headers)
    assert response.status_code == 200, response.text
    data = response.json()
    reports = data["reports"]
    assert {key: reports[key] for key in ("total", "pending", "resolved", "dismissed", "reported_players", "reporters", "with_evidence", "without_game")} == {
        "total": 4, "pending": 2, "resolved": 1, "dismissed": 1, "reported_players": 2,
        "reporters": 3, "with_evidence": 2, "without_game": 3,
    }
    assert {item["key"]: item["count"] for item in reports["reasons"]} == {"cheating": 3, "other": 1}
    assert reports["games"] == [
        {"videogame_id": None, "name": "Sin juego especificado", "count": 3},
        {"videogame_id": game.videogame_id, "name": game.name, "count": 1},
    ]
    assert [row["count"] for row in reports["top_players"]] == [3, 1]
    assert reports["top_players"][0]["reporters"] == 2
    assert reports["top_players"][1]["username"] == "Cuenta eliminada"
    assert "nombre-privado" not in response.text
    assert data["activity"] == [{"month": "2026-11", "reports": 4, "bans": 0}]
    limited = client.get(URL, params={"ranking_limit": 1}, headers=admin_auth_headers).json()
    assert len(limited["reports"]["top_players"]) == 1
    # Sin final explícito se incluye el instante de generación, nunca el futuro.
    assert limited["reports"]["total"] == 6


def test_ban_lifecycle_repeat_offenders_and_appeals_have_independent_periods(
    client, test_db_session, admin_auth_headers,
):
    users = [UserORM(name=f"Jugador {i}", username=f"jugador{i}", role="player", banned=True) for i in range(6)]
    test_db_session.add_all(users)
    test_db_session.flush()
    # La reincidencia tiene en cuenta sanciones anteriores al período.
    old = add_ban(test_db_session, users[0], START - timedelta(days=30), end_reason="expired", ended_at=START - timedelta(days=20))
    add_ban(test_db_session, users[0], expires_at=NOW + timedelta(days=1))
    add_ban(test_db_session, users[1], expires_at=NOW)  # Venció aunque user.banned aún sea True.
    manual = add_ban(test_db_session, users[2], end_reason="manual", ended_at=NOW - timedelta(days=1), expires_at=NOW - timedelta(hours=1))
    accepted = add_ban(test_db_session, users[3], end_reason="appeal", ended_at=NOW - timedelta(days=1), expires_at=NOW - timedelta(hours=1))
    add_ban(test_db_session, users[4], end_reason="superseded", ended_at=START + timedelta(days=1))
    add_ban(test_db_session, users[4], created=START + timedelta(days=1), expires_at=None)
    users[5].banned = False
    add_ban(test_db_session, users[5], end_reason="expired", ended_at=NOW - timedelta(days=1))
    test_db_session.add_all([
        BanAppealORM(ban_record_id=old.id, text="Baneo anterior", status="pending", created_at=START),
        BanAppealORM(ban_record_id=accepted.id, text="Aceptada", status="accepted", created_at=START),
        BanAppealORM(ban_record_id=manual.id, text="Fuera del período", status="rejected", created_at=START - timedelta(days=1)),
    ])
    test_db_session.commit()
    response = client.get(URL, params={"start_date": START.isoformat(), "end_date": NOW.isoformat()}, headers=admin_auth_headers)
    assert response.status_code == 200, response.text
    data = response.json()
    bans = data["bans"]
    assert {key: bans[key] for key in ("total", "active", "finalized", "banned_players", "repeat_offenders")} == {
        "total": 7, "active": 2, "finalized": 5, "banned_players": 6, "repeat_offenders": 2,
    }
    assert {item["key"]: item["count"] for item in bans["outcomes"]} == {
        "active": 2, "expired": 2, "manual": 1, "appeal": 1, "superseded": 1,
    }
    assert bans["top_players"][0]["user_id"] == users[4].user_id
    assert bans["top_players"][0]["repeat_offender"] is True
    assert data["appeals"] == {"total": 2, "pending": 1, "accepted": 1, "rejected": 0}


def test_empty_report_and_admin_authorization(client, admin_auth_headers, player_auth_headers):
    assert client.get(URL).status_code == 401
    assert client.get(URL, headers=player_auth_headers).status_code == 403
    response = client.get(URL, headers=admin_auth_headers)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["reports"]["total"] == data["bans"]["total"] == data["appeals"]["total"] == 0
    assert data["reports"]["top_players"] == data["bans"]["outcomes"] == data["activity"] == []


@pytest.mark.parametrize("params", [
    {"start_date": NOW.isoformat(), "end_date": NOW.isoformat()},
    {"start_date": (NOW + timedelta(days=1)).isoformat()},
    {"start_date": "invalid"}, {"ranking_limit": 0}, {"ranking_limit": 101},
])
def test_invalid_statistics_parameters(client, admin_auth_headers, params):
    assert client.get(URL, params=params, headers=admin_auth_headers).status_code == 422


def test_optional_game_is_saved_and_available_in_report_details(
    client, player_auth_headers, seed_admin, seed_catalog_data, admin_auth_headers, test_db_session,
):
    game = seed_catalog_data["videogame"]
    response = client.post("/api/v1/moderation/", headers=player_auth_headers, data={
        "reported_id": seed_admin.user_id, "reason": "cheating", "videogame_id": game.videogame_id,
    })
    assert response.status_code in (200, 201), response.text
    assert response.json()["videogame_name"] == game.name
    report = test_db_session.get(PlayerReportORM, response.json()["report_id"])
    assert report.videogame_id == game.videogame_id
    listed = client.get("/api/v1/moderation/reported_players", headers=admin_auth_headers).json()
    assert listed["reports"][0]["videogame_name"] == game.name


@pytest.mark.parametrize("game_id, deleted", [(99999, False), (0, False), (-1, False), (None, True)])
def test_optional_game_rejects_missing_or_deleted_catalog_entry(
    client, player_auth_headers, seed_admin, seed_catalog_data, test_db_session, game_id, deleted,
):
    if deleted:
        game = seed_catalog_data["videogame"]
        game.deleted = True
        test_db_session.commit()
        game_id = game.videogame_id
    response = client.post("/api/v1/moderation/", headers=player_auth_headers, data={
        "reported_id": seed_admin.user_id, "reason": "cheating", "videogame_id": game_id,
    })
    assert response.status_code in (404, 422), response.text
