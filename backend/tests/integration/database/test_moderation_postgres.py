from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from threading import Barrier

from app.application.use_cases.report_player import ReportPlayer
from app.domain.exceptions.moderation.report_cooldown_exception import ReportCooldownException
from app.infrastructure.api.dto.request.report_player_request import ReportPlayerRequest
from app.infrastructure.database.models import PlayerReportORM, UserBanRecordORM, UserORM
from app.infrastructure.database.repositories.moderation_repository_impl import ModerationRepositoryImpl
from app.infrastructure.database.unit_of_work.unit_of_work_impl import SqlAlchemyUnitOfWork


def test_executive_statistics_aggregate_games_repeat_offenders_and_utc_months(postgres_sessions):
    from sqlalchemy import text
    from app.domain.models.report_reason import ReportReason
    from app.domain.models.report_status import ReportStatus
    from app.infrastructure.database.models import VideogameORM
    from app.infrastructure.database.repositories.moderation_statistics_repository_impl import ModerationStatisticsRepositoryImpl

    created = datetime(2026, 11, 1, 0, 30, tzinfo=timezone.utc)
    with postgres_sessions.begin() as session:
        target = UserORM(name="Target", username="target", role="player", banned=True)
        reporter = UserORM(name="Reporter", username="reporter", role="player")
        game = VideogameORM(name="Juego", icon_url="/icon.png", rank_per_role=False)
        session.add_all([target, reporter, game])
        session.flush()
        session.add_all([
            PlayerReportORM(reporter_id=reporter.user_id, reported_id=target.user_id,
                            reason=ReportReason.CHEATING, status=ReportStatus.PENDING,
                            created_at=created, videogame_id=game.videogame_id),
            UserBanRecordORM(banned_user_id=target.user_id, reason="Anterior", created_at=created - timedelta(days=10),
                             end_reason="expired", ended_at=created - timedelta(days=5)),
        ])
        session.flush()
        session.add(UserBanRecordORM(banned_user_id=target.user_id, reason="Actual", created_at=created, expires_at=created + timedelta(days=20)))
    with postgres_sessions() as session:
        # Configurar la zona de la conexión antes de iniciar la consulta coherente.
        session.execute(text("SET TIME ZONE 'America/Argentina/Cordoba'"))
        session.commit()
        stats = ModerationStatisticsRepositoryImpl(session).query(created, None, created + timedelta(days=1), 10)
        assert stats["reports"]["total"] == stats["bans"]["active"] == stats["bans"]["repeat_offenders"] == 1
        assert stats["reports"]["games"][0]["name"] == "Juego"
        assert stats["bans"]["top_players"][0]["repeat_offender"] is True
        assert stats["activity"] == [{"month": "2026-11", "reports": 1, "bans": 1}]


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


def test_dismiss_and_ban_from_same_report_cannot_both_succeed(postgres_sessions):
    from app.application.use_cases.ban_player import BanPlayer
    from app.application.use_cases.dismiss_player_report import DismissPlayerReport
    from app.domain.exceptions.domain_exception import DomainException
    from app.domain.models.report_status import ReportStatus
    from app.infrastructure.api.dto.request.ban_player_request import BanPlayerRequest

    with postgres_sessions.begin() as session:
        admin = UserORM(name="Admin", username="moderator", role="admin")
        player = UserORM(name="Player", username="reported", role="player")
        session.add_all([admin, player])
        session.flush()
        report = PlayerReportORM(reporter_id=admin.user_id, reported_id=player.user_id, reason="cheating", status=ReportStatus.PENDING)
        session.add(report)
        session.flush()
        admin_id, player_id, report_id = admin.user_id, player.user_id, report.id

    barrier = Barrier(2, timeout=10)
    def resolve(action):
        barrier.wait()
        try:
            uow = SqlAlchemyUnitOfWork(postgres_sessions)
            if action == "ban":
                BanPlayer(uow).execute(BanPlayerRequest(player_id=player_id, reason="Scripts", duration_days=7, report_id=report_id), admin_id)
            else:
                DismissPlayerReport(uow).execute(report_id, admin_id)
            return 200
        except DomainException as error:
            return error.status_code

    with ThreadPoolExecutor(max_workers=2) as pool:
        assert sorted(pool.map(resolve, ["ban", "dismiss"])) == [200, 409]
    with postgres_sessions() as session:
        status = session.get(PlayerReportORM, report_id).status
        assert status in (ReportStatus.RESOLVED, ReportStatus.REJECTED)
        assert session.get(UserORM, player_id).banned is (status == ReportStatus.RESOLVED)
        assert session.query(UserBanRecordORM).count() == (1 if status == ReportStatus.RESOLVED else 0)
