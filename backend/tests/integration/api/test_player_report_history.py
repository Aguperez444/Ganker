from datetime import datetime, timedelta, timezone

import pytest

from app.domain.models.report_reason import ReportReason
from app.domain.models.report_status import ReportStatus
from app.infrastructure.database.models.player_report_orm import PlayerReportORM
from app.infrastructure.database.models.user_orm import UserORM


def test_report_history_filters_exact_player_before_pagination(
    client, test_db_session, seed_player, seed_admin, admin_auth_headers,
):
    target = UserORM(name="Ana", username="ana", role="player")
    similar = UserORM(name="Anabel", username="anabel", role="player")
    test_db_session.add_all([target, similar])
    test_db_session.flush()
    now = datetime.now(timezone.utc)
    reports = []
    for index, (user, status) in enumerate([
        (target, ReportStatus.PENDING),
        (similar, ReportStatus.PENDING),
        (target, ReportStatus.RESOLVED),
    ]):
        report = PlayerReportORM(
            reporter_id=seed_player.user_id, reported_id=user.user_id,
            reason=ReportReason.CHEATING, status=status,
            description=f"Reporte {index}", created_at=now - timedelta(days=index),
            evidence_image_url="/media/reports/evidence/test.png",
        )
        test_db_session.add(report)
        reports.append(report)
    test_db_session.commit()

    endpoint = "/api/v1/moderation/reported_players"
    params = {"reported_user_id": target.user_id, "limit": 1}
    first = client.get(endpoint, params=params, headers=admin_auth_headers)
    assert first.status_code == 200
    assert [row["id"] for row in first.json()["reports"]] == [reports[0].id]
    second = client.get(endpoint, params={**params, "skip": 1}, headers=admin_auth_headers)
    assert [row["id"] for row in second.json()["reports"]] == [reports[2].id]
    assert second.json()["reports"][0]["evidence_image_url"] == "/media/reports/evidence/test.png"

    filtered = client.get(endpoint, params={
        **params, "status": "resolved", "reason": "cheating",
    }, headers=admin_auth_headers)
    assert [row["id"] for row in filtered.json()["reports"]] == [reports[2].id]

    # Aplicar la sanción resuelve las denuncias, que siguen disponibles en el historial.
    banned = client.post("/api/v1/moderation/ban", json={
        "player_id": target.user_id, "reason": "Uso reiterado de scripts", "duration_days": 36500,
    }, headers=admin_auth_headers)
    assert banned.status_code == 200
    history = client.get(endpoint, params={"reported_user_id": target.user_id}, headers=admin_auth_headers)
    assert len(history.json()["reports"]) == 2
    assert all(row["status"] == "resolved" for row in history.json()["reports"])
    assert all(row["reported_user_id"] == target.user_id for row in history.json()["reports"])


@pytest.mark.parametrize("player_id", [0, -1, "invalid"])
def test_report_history_rejects_invalid_player_id(client, admin_auth_headers, player_id):
    response = client.get("/api/v1/moderation/reported_players", params={
        "reported_user_id": player_id,
    }, headers=admin_auth_headers)
    assert response.status_code == 422
