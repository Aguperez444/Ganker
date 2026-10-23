from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from threading import Barrier

from app.application.use_cases.report_player import ReportPlayer
from app.domain.exceptions.moderation.report_cooldown_exception import ReportCooldownException
from app.infrastructure.api.dto.request.report_player_request import ReportPlayerRequest
from app.infrastructure.database.models import PlayerReportORM, UserBanRecordORM, UserORM
from app.infrastructure.database.repositories.moderation_repository_impl import ModerationRepositoryImpl
from app.infrastructure.database.unit_of_work.unit_of_work_impl import SqlAlchemyUnitOfWork


def test_concurrent_reports_only_create_one_record(postgres_sessions):
    with postgres_sessions.begin() as session:
        reporter = UserORM(name="Reporter", username="reporter", role="player")
        target = UserORM(name="Target", username="target", role="player")
        session.add_all([reporter, target])
        session.flush()
        reporter_id, target_id = reporter.user_id, target.user_id

    start = Barrier(2, timeout=10)

    def report():
        start.wait()
        try:
            ReportPlayer(SqlAlchemyUnitOfWork(postgres_sessions)).execute(
                ReportPlayerRequest(reported_id=target_id, reason="spamming", description="Spam"),
                reporter_id,
            )
            return 201
        except ReportCooldownException:
            return 429

    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = [executor.submit(report) for _ in range(2)]
        assert sorted(future.result(timeout=15) for future in futures) == [201, 429]
    with postgres_sessions() as session:
        assert session.query(PlayerReportORM).count() == 1


def test_active_bans_filter_latest_record_with_postgres_timestamps(postgres_sessions):
    now = datetime.now(timezone.utc)
    with postgres_sessions.begin() as session:
        active = UserORM(name="Active", username="active", role="player", banned=True)
        expired = UserORM(name="Expired", username="expired", role="player", banned=True)
        session.add_all([active, expired])
        session.flush()
        active_id = active.user_id
        for user, expires_at, reason in [
            (active, now - timedelta(days=1), "Anterior"),
            (active, now + timedelta(days=1), "Vigente"),
            (expired, now + timedelta(days=1), "Anterior"),
            (expired, now - timedelta(days=1), "Vencido"),
        ]:
            session.add(UserBanRecordORM(banned_user_id=user.user_id, reason=reason, expires_at=expires_at))
            session.flush()
    with postgres_sessions() as session:
        rows = ModerationRepositoryImpl(session).get_active_bans("ACT", 0, 10)
        assert rows == [(active_id, "active", "Vigente", now + timedelta(days=1))]
