from datetime import datetime, timezone

import pytest

from app.domain.models.report_reason import ReportReason
from app.domain.models.report_status import ReportStatus
from app.infrastructure.database.models import PlayerReportORM, UserBanRecordORM, UserORM

PREFIX = "/api/v1/moderation"


@pytest.fixture
def report(test_db_session, seed_player):
    target = UserORM(name="Reported", username="reported", role="player")
    test_db_session.add(target)
    test_db_session.flush()
    row = PlayerReportORM(reporter_id=seed_player.user_id, reported_id=target.user_id,
                          reason=ReportReason.CHEATING, status=ReportStatus.PENDING, description="Posibles scripts")
    test_db_session.add(row)
    test_db_session.commit()
    return row


def test_admin_dismisses_report_without_ban_and_records_decision(client, report, seed_admin, admin_auth_headers, test_db_session):
    before = datetime.now(timezone.utc).replace(tzinfo=None)
    response = client.post(f"{PREFIX}/reports/{report.id}/dismiss", headers=admin_auth_headers)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] == "rejected"
    assert data["resolved_by"] == seed_admin.username
    test_db_session.expire_all()
    assert report.status == ReportStatus.REJECTED
    assert report.resolver_id == seed_admin.user_id
    assert before <= report.resolved_at <= datetime.now(timezone.utc).replace(tzinfo=None)
    assert test_db_session.get(UserORM, report.reported_id).banned is False
    assert test_db_session.query(UserBanRecordORM).count() == 0
    assert client.post(f"{PREFIX}/reports/{report.id}/dismiss", headers=admin_auth_headers).status_code == 409


@pytest.mark.parametrize("status", [ReportStatus.RESOLVED, ReportStatus.REJECTED])
def test_closed_report_cannot_be_used_to_ban_or_be_dismissed_again(client, report, status, admin_auth_headers, test_db_session):
    report.status = status
    test_db_session.commit()
    response = client.post(f"{PREFIX}/ban", json={
        "player_id": report.reported_id, "reason": "Scripts", "duration_days": 7, "report_id": report.id,
    }, headers=admin_auth_headers)
    assert response.status_code == 409
    assert "cerrada" in response.json()["error"]
    assert client.post(f"{PREFIX}/reports/{report.id}/dismiss", headers=admin_auth_headers).status_code == 409
    assert test_db_session.query(UserBanRecordORM).count() == 0


def test_pending_report_can_be_used_to_ban_its_player(client, report, admin_auth_headers, test_db_session):
    response = client.post(f"{PREFIX}/ban", json={
        "player_id": report.reported_id, "reason": "Scripts", "duration_days": 7, "report_id": report.id,
    }, headers=admin_auth_headers)
    assert response.status_code == 200
    test_db_session.expire_all()
    assert report.status == ReportStatus.RESOLVED
    assert test_db_session.get(UserORM, report.reported_id).banned is True


def test_dismissed_report_stays_dismissed_if_a_later_ban_is_applied(client, report, admin_auth_headers, test_db_session):
    client.post(f"{PREFIX}/reports/{report.id}/dismiss", headers=admin_auth_headers)
    response = client.post(f"{PREFIX}/ban", json={
        "player_id": report.reported_id, "reason": "Una sanción independiente", "duration_days": 7,
    }, headers=admin_auth_headers)
    assert response.status_code == 200
    test_db_session.expire_all()
    assert report.status == ReportStatus.REJECTED


def test_report_must_match_banned_player(client, report, seed_player, admin_auth_headers, test_db_session):
    response = client.post(f"{PREFIX}/ban", json={
        "player_id": seed_player.user_id, "reason": "Scripts", "duration_days": 7, "report_id": report.id,
    }, headers=admin_auth_headers)
    assert response.status_code == 422
    assert test_db_session.query(UserBanRecordORM).count() == 0


def test_dismiss_requires_admin_and_existing_report(client, report, player_auth_headers, admin_auth_headers):
    assert client.post(f"{PREFIX}/reports/{report.id}/dismiss", headers=player_auth_headers).status_code == 403
    assert client.post(f"{PREFIX}/reports/999999/dismiss", headers=admin_auth_headers).status_code == 404


def test_dismiss_checks_current_admin_role(client, report, seed_admin, admin_auth_headers, test_db_session):
    seed_admin.role = "player"
    test_db_session.commit()
    assert client.post(f"{PREFIX}/reports/{report.id}/dismiss", headers=admin_auth_headers).status_code == 403


def test_deleted_player_report_cannot_be_dismissed(client, report, admin_auth_headers, test_db_session):
    test_db_session.get(UserORM, report.reported_id).deleted = True
    test_db_session.commit()
    assert client.post(f"{PREFIX}/reports/{report.id}/dismiss", headers=admin_auth_headers).status_code == 404
