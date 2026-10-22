from datetime import datetime, timedelta, timezone

import pytest
from freezegun import freeze_time

from app.domain.models.report_status import ReportStatus
from app.infrastructure.config.settings import settings
from app.infrastructure.database.models.player_report_orm import PlayerReportORM
from app.infrastructure.database.models.user_orm import UserORM


REPORT_URL = "/api/v1/moderation/"


@pytest.fixture(autouse=True)
def report_cooldown(monkeypatch):
    monkeypatch.setattr(settings, "player_report_cooldown_seconds", 86400)


def _player(session, username):
    user = UserORM(name=username, username=username, role="player")
    session.add(user)
    session.commit()
    return user


def _headers(jwt_service, user):
    token, *_ = jwt_service.generate_tokens(user.user_id, user.role)
    return {"Authorization": f"Bearer {token}"}


def test_report_cooldown_survives_new_requests_and_expires_at_boundary(
    client, seed_player, jwt_service, test_db_session,
):
    target = _player(test_db_session, "target")
    payload = {"reported_id": target.user_id, "reason": "spamming", "description": "Spam reiterado"}
    with freeze_time("2026-10-22 12:00:00") as clock:
        first = client.post(REPORT_URL, json=payload, headers=_headers(jwt_service, seed_player))
        assert first.status_code == 201
        blocked = client.post(REPORT_URL, json=payload, headers=_headers(jwt_service, seed_player))
        assert blocked.status_code == 429
        assert blocked.headers["Retry-After"] == "86400"
        assert blocked.json()["retry_after"] == 86400
        assert datetime.fromisoformat(blocked.json()["retry_at"]) == datetime(
            2026, 10, 23, 12, tzinfo=timezone.utc,
        )
        assert "Ya reportaste a este jugador" in blocked.json()["error"]

        # Resolver el reporte o cambiar el motivo no permite saltarse la espera.
        report = test_db_session.query(PlayerReportORM).one()
        report.status = ReportStatus.RESOLVED
        test_db_session.commit()
        clock.tick(timedelta(days=1) - timedelta(milliseconds=500))
        payload.update(reason="cheating", description="Otro motivo")
        almost = client.post(REPORT_URL, json=payload, headers=_headers(jwt_service, seed_player))
        assert almost.status_code == 429
        assert almost.headers["Retry-After"] == "1"
        assert test_db_session.query(PlayerReportORM).count() == 1

        # Los intentos rechazados no extienden la espera.
        clock.tick(timedelta(milliseconds=500))
        allowed = client.post(REPORT_URL, json=payload, headers=_headers(jwt_service, seed_player))
        assert allowed.status_code == 201
        assert test_db_session.query(PlayerReportORM).count() == 2


def test_report_cooldown_is_scoped_to_reporter_and_target(
    client, seed_player, jwt_service, test_db_session,
):
    target = _player(test_db_session, "target")
    other = _player(test_db_session, "other")
    for reporter, reported in [(seed_player, target), (other, target), (seed_player, other)]:
        response = client.post(REPORT_URL, json={
            "reported_id": reported.user_id, "reason": "spamming", "description": "Spam reiterado",
        }, headers=_headers(jwt_service, reporter))
        assert response.status_code == 201
    assert test_db_session.query(PlayerReportORM).count() == 3


def test_report_cooldown_uses_configured_interval(
    client, seed_player, jwt_service, test_db_session, monkeypatch,
):
    monkeypatch.setattr(settings, "player_report_cooldown_seconds", 300)
    target = _player(test_db_session, "target")
    payload = {"reported_id": target.user_id, "reason": "spamming", "description": "Spam reiterado"}
    with freeze_time("2026-10-22 12:00:00") as clock:
        first = client.post(REPORT_URL, json=payload, headers=_headers(jwt_service, seed_player))
        assert first.status_code == 201
        blocked = client.post(REPORT_URL, json=payload, headers=_headers(jwt_service, seed_player))
        assert blocked.status_code == 429
        assert blocked.headers["Retry-After"] == "300"
        clock.tick(timedelta(minutes=5))
        allowed = client.post(REPORT_URL, json=payload, headers=_headers(jwt_service, seed_player))
        assert allowed.status_code == 201
