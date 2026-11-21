from datetime import datetime, timedelta, timezone

import pytest

from app.domain.models.report_reason import ReportReason
from app.domain.models.report_status import ReportStatus
from app.infrastructure.database.models import PlayerReportORM, UserORM


@pytest.fixture
def report_pair(test_db_session, seed_player):
    juan = UserORM(name="Juan", username="juan", role="player")
    similar = UserORM(name="Juan Similar", username="juan_extra", role="player")
    test_db_session.add_all([juan, similar])
    test_db_session.flush()
    created = datetime(2026, 11, 16, 12, tzinfo=timezone.utc)
    reference = PlayerReportORM(reporter_id=seed_player.user_id, reported_id=juan.user_id,
                                reason=ReportReason.CHEATING, status=ReportStatus.PENDING, created_at=created)
    test_db_session.add(reference)
    test_db_session.commit()
    return reference, juan, similar, created


def add_report(session, reporter_id, reported_id, created, status=ReportStatus.PENDING, **kwargs):
    row = PlayerReportORM(reporter_id=reporter_id, reported_id=reported_id,
                          created_at=created, reason=ReportReason.ABUSIVE_BEHAVIOR, status=status, **kwargs)
    session.add(row)
    session.flush()
    return row


def test_cross_reports_match_exact_inverse_pair_with_inclusive_48_hour_boundaries(
    client, report_pair, seed_player, admin_auth_headers, test_db_session,
):
    reference, juan, similar, created = report_pair
    matches = [add_report(test_db_session, juan.user_id, seed_player.user_id, created + delta, status=status) for delta, status in [
        (-timedelta(hours=48), ReportStatus.REJECTED),
        (-timedelta(hours=1), ReportStatus.RESOLVED),
        (timedelta(0), ReportStatus.PENDING),
        (timedelta(hours=48), ReportStatus.PENDING),
    ]]
    for delta in [-timedelta(hours=48, microseconds=1), timedelta(hours=48, microseconds=1)]:
        add_report(test_db_session, juan.user_id, seed_player.user_id, created + delta)
    # Mismos nombres parciales, dirección original y terceros no coinciden.
    add_report(test_db_session, similar.user_id, seed_player.user_id, created)
    add_report(test_db_session, juan.user_id, similar.user_id, created)
    add_report(test_db_session, seed_player.user_id, juan.user_id, created)
    test_db_session.commit()
    response = client.get(f"/api/v1/moderation/reports/{reference.id}/cross-reports", headers=admin_auth_headers)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["window_hours"] == 48
    assert datetime.fromisoformat(data["window_start"]) == created - timedelta(hours=48)
    assert datetime.fromisoformat(data["window_end"]) == created + timedelta(hours=48)
    assert [row["id"] for row in data["reports"]] == [row.id for row in matches]
    assert {row["status"] for row in data["reports"]} == {"pending", "resolved", "rejected"}


def test_cross_reports_paginate_without_losing_evidence(client, report_pair, seed_player, admin_auth_headers, test_db_session):
    reference, juan, _, created = report_pair
    first = add_report(test_db_session, juan.user_id, seed_player.user_id, created,
                       description="Respuesta cruzada", evidence_image_url="/media/reports/evidence/proof.png",
                       evidence_video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    second = add_report(test_db_session, juan.user_id, seed_player.user_id, created)
    test_db_session.commit()
    url = f"/api/v1/moderation/reports/{reference.id}/cross-reports"
    data = client.get(url, params={"limit": 1}, headers=admin_auth_headers).json()
    assert [row["id"] for row in data["reports"]] == [first.id]
    assert data["reports"][0]["evidence_image_url"] == "/media/reports/evidence/proof.png"
    assert data["reports"][0]["evidence_video_url"]
    next_page = client.get(url, params={"skip": 1, "limit": 1}, headers=admin_auth_headers).json()
    assert [row["id"] for row in next_page["reports"]] == [second.id]


def test_reference_report_can_be_closed_and_no_match_is_an_empty_list(client, report_pair, admin_auth_headers, test_db_session):
    reference, _, _, _ = report_pair
    reference.status = ReportStatus.REJECTED
    test_db_session.commit()
    response = client.get(f"/api/v1/moderation/reports/{reference.id}/cross-reports", headers=admin_auth_headers)
    assert response.status_code == 200
    assert response.json()["reports"] == []


def test_cross_reports_require_admin_and_existing_visible_reference(client, report_pair, admin_auth_headers, player_auth_headers, test_db_session):
    reference, juan, _, _ = report_pair
    url = f"/api/v1/moderation/reports/{reference.id}/cross-reports"
    assert client.get(url, headers=player_auth_headers).status_code == 403
    assert client.get(url).status_code == 401
    assert client.get("/api/v1/moderation/reports/999999/cross-reports", headers=admin_auth_headers).status_code == 404
    juan.deleted = True
    test_db_session.commit()
    assert client.get(url, headers=admin_auth_headers).status_code == 404


@pytest.mark.parametrize("params", [{"skip": -1}, {"limit": 0}, {"limit": 101}])
def test_cross_reports_validate_pagination(client, report_pair, admin_auth_headers, params):
    reference, *_ = report_pair
    assert client.get(f"/api/v1/moderation/reports/{reference.id}/cross-reports", params=params, headers=admin_auth_headers).status_code == 422
