import time
from datetime import datetime, timedelta, timezone

import pytest

from app.application.use_cases.ban_player import BanPlayer
from app.application.use_cases.save_message import SaveMessage
from app.infrastructure.api.dto.request.ban_player_request import BanPlayerRequest
from app.infrastructure.database.models import UserORM
from app.infrastructure.database.models.conversation_orm import ConversationORM
from app.infrastructure.database.models.player_report_orm import PlayerReportORM
from app.infrastructure.database.models.user_ban_record_orm import UserBanRecordORM
from app.infrastructure.database.repositories.moderation_repository_impl import ModerationRepositoryImpl
from app.infrastructure.database.unit_of_work.unit_of_work_impl import SqlAlchemyUnitOfWork


pytestmark = pytest.mark.parametrize(
    "postgres_sessions", ["UTC", "America/Argentina/Cordoba", "Asia/Tokyo"], indirect=True,
)


@pytest.fixture(autouse=True, params=["UTC", "America/Argentina/Cordoba"])
def server_timezone(request, monkeypatch):
    try:
        with monkeypatch.context() as patch:
            patch.setenv("TZ", request.param)
            time.tzset()
            yield
    finally:
        time.tzset()


@pytest.fixture
def test_session_factory(postgres_sessions):
    return postgres_sessions


def test_login_refresh_and_logout_store_utc_activity(client, seed_player, test_db_session):
    before = datetime.now(timezone.utc).replace(tzinfo=None)
    response = client.post("/auth/v1/login", data={
        "username": seed_player.mail, "password": "Password123",
    })
    assert response.status_code == 200
    for endpoint in ("refresh", "logout"):
        test_db_session.expire_all()
        assert before <= seed_player.last_connection <= datetime.now(timezone.utc).replace(tzinfo=None)
        before = datetime.now(timezone.utc).replace(tzinfo=None)
        response = client.post(f"/auth/v1/{endpoint}", json={
            "refresh_token": response.json()["refresh_token"],
        })
        assert response.status_code == (200 if endpoint == "refresh" else 204)
    test_db_session.expire_all()
    assert before <= seed_player.last_connection <= datetime.now(timezone.utc).replace(tzinfo=None)


def test_ban_resolution_and_manual_unban_preserve_instants(postgres_sessions, seed_player, seed_admin):
    with postgres_sessions.begin() as session:
        session.add(PlayerReportORM(
            reporter_id=seed_admin.user_id, reported_id=seed_player.user_id,
            reason="SPAMMING", created_at=datetime.now(timezone.utc),
        ))
    before = datetime.now(timezone.utc)
    BanPlayer(SqlAlchemyUnitOfWork(postgres_sessions)).execute(
        BanPlayerRequest(player_id=seed_player.user_id, reason="Abuso", duration_days=1),
        seed_admin.user_id,
    )
    after = datetime.now(timezone.utc)
    with postgres_sessions() as session:
        ban = session.query(UserBanRecordORM).one()
        report = session.query(PlayerReportORM).one()
        assert before <= ban.created_at <= after
        assert ban.expires_at - ban.created_at == timedelta(days=1)
        assert before <= report.resolved_at <= after
        before_unban = datetime.now(timezone.utc)
        ModerationRepositoryImpl(session).manual_unban_user(seed_player.user_id)
        session.commit()
    with postgres_sessions() as session:
        ban = session.query(UserBanRecordORM).one()
        assert before_unban <= ban.expires_at <= datetime.now(timezone.utc)
        assert session.get(UserORM, seed_player.user_id).banned is False


def test_moderation_defaults_preserve_instants(postgres_sessions, seed_player, seed_admin):
    before = datetime.now(timezone.utc)
    with postgres_sessions.begin() as session:
        session.add_all([
            PlayerReportORM(reporter_id=seed_admin.user_id, reported_id=seed_player.user_id, reason="SPAMMING"),
            UserBanRecordORM(banned_user_id=seed_player.user_id, reason="Abuso"),
        ])
    with postgres_sessions() as session:
        after = datetime.now(timezone.utc)
        assert before <= session.query(PlayerReportORM).one().created_at <= after
        assert before <= session.query(UserBanRecordORM).one().created_at <= after


def test_saved_message_preserves_instant(postgres_sessions, seed_player):
    with postgres_sessions.begin() as session:
        conversation = ConversationORM()
        session.add(conversation)
        session.flush()
        conversation_id = conversation.conversation_id
    before = datetime.now(timezone.utc)
    message = SaveMessage(SqlAlchemyUnitOfWork(postgres_sessions)).execute(
        conversation_id, seed_player.user_id, "Hola",
    )
    assert before <= message.timestamp <= datetime.now(timezone.utc)


def test_extreme_ban_duration_is_readable_in_every_timezone(postgres_sessions, seed_player, seed_admin):
    BanPlayer(SqlAlchemyUnitOfWork(postgres_sessions)).execute(
        BanPlayerRequest(player_id=seed_player.user_id, reason="Abuso", duration_days=10**30),
        seed_admin.user_id,
    )
    with postgres_sessions() as session:
        ban = session.query(UserBanRecordORM).one()
        assert ban.expires_at.year == 9999
        assert ban.expires_at.astimezone(timezone.utc).year == 9999
        assert len(ModerationRepositoryImpl(session).get_active_bans(None, 0, 10)) == 1
