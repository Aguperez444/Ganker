from sqlalchemy import and_, case, extract, func, or_
from sqlalchemy.orm import aliased

from app.application.ports.i_moderation_statistics_repository import IModerationStatisticsRepository
from app.domain.models.report_status import ReportStatus
from app.infrastructure.database.models.ban_appeal_orm import BanAppealORM
from app.infrastructure.database.models.player_report_orm import PlayerReportORM
from app.infrastructure.database.models.user_ban_record_orm import UserBanRecordORM
from app.infrastructure.database.models.user_orm import UserORM
from app.infrastructure.database.models.videogame_orm import VideogameORM


def value_of(value):
    return str(getattr(value, "value", value))


class ModerationStatisticsRepositoryImpl(IModerationStatisticsRepository):
    def __init__(self, session):
        self.session = session

    @staticmethod
    def _period(query, column, start, end, as_of):
        query = query.filter(column <= as_of)
        if end is not None:
            query = query.filter(column < end)
        return query.filter(column >= start) if start is not None else query

    def _reports(self, start, end, as_of, ranking_limit):
        report = PlayerReportORM
        query = self._period(self.session.query(report), report.created_at, start, end, as_of)
        evidence = or_(func.nullif(func.trim(report.evidence_image_url), "").is_not(None),
                       func.nullif(func.trim(report.evidence_video_url), "").is_not(None))
        counts = query.with_entities(
            func.count(report.id),
            func.coalesce(func.sum(case((report.status == ReportStatus.PENDING, 1), else_=0)), 0),
            func.coalesce(func.sum(case((report.status == ReportStatus.RESOLVED, 1), else_=0)), 0),
            func.coalesce(func.sum(case((report.status == ReportStatus.REJECTED, 1), else_=0)), 0),
            func.count(func.distinct(report.reported_id)), func.count(func.distinct(report.reporter_id)),
            func.coalesce(func.sum(case((evidence, 1), else_=0)), 0),
            func.coalesce(func.sum(case((report.videogame_id.is_(None), 1), else_=0)), 0),
        ).one()
        reasons = query.with_entities(report.reason, func.count(report.id)).group_by(report.reason).all()
        games = query.outerjoin(VideogameORM, VideogameORM.videogame_id == report.videogame_id).with_entities(
            report.videogame_id, VideogameORM.name, func.count(report.id).label("count"),
        ).group_by(report.videogame_id, VideogameORM.name).order_by(func.count(report.id).desc(), report.videogame_id).all()
        ranking = query.join(UserORM, UserORM.user_id == report.reported_id).with_entities(
            UserORM.user_id, UserORM.username, UserORM.deleted,
            func.count(report.id).label("count"), func.count(func.distinct(report.reporter_id)).label("reporters"),
        ).group_by(UserORM.user_id, UserORM.username, UserORM.deleted).order_by(
            func.count(report.id).desc(), UserORM.user_id,
        ).limit(ranking_limit).all()
        return {
            **dict(zip(("total", "pending", "resolved", "dismissed", "reported_players", "reporters", "with_evidence", "without_game"), map(int, counts))),
            "reasons": [{"key": value_of(reason), "count": int(count)} for reason, count in reasons],
            "games": [{"videogame_id": game_id, "name": name or "Sin juego especificado", "count": int(count)} for game_id, name, count in games],
            "top_players": [{"user_id": row.user_id, "username": "Cuenta eliminada" if row.deleted else row.username,
                             "deleted": row.deleted, "count": int(row.count), "reporters": int(row.reporters)} for row in ranking],
        }

    def _bans(self, start, end, as_of, ranking_limit):
        ban = UserBanRecordORM
        latest = self.session.query(ban.banned_user_id, func.max(ban.id).label("latest_id")).filter(ban.created_at <= as_of).group_by(ban.banned_user_id).subquery()
        query = self._period(self.session.query(ban).join(UserORM, UserORM.user_id == ban.banned_user_id)
                             .join(latest, latest.c.banned_user_id == ban.banned_user_id), ban.created_at, start, end, as_of)
        outcome = case(
            (ban.end_reason.in_(["manual", "appeal", "superseded", "unknown"]), ban.end_reason),
            (or_(ban.end_reason == "expired", and_(ban.expires_at.is_not(None), ban.expires_at <= as_of)), "expired"),
            (and_(ban.id == latest.c.latest_id, UserORM.banned.is_(True), ban.ended_at.is_(None)), "active"),
            else_="unknown",
        )
        outcomes = query.with_entities(outcome.label("outcome"), func.count(ban.id)).group_by(outcome).all()
        previous = aliased(UserBanRecordORM)
        has_previous = self.session.query(previous.id).filter(previous.banned_user_id == ban.banned_user_id, previous.id < ban.id).exists()
        players, repeat = query.with_entities(
            func.count(func.distinct(ban.banned_user_id)),
            func.count(func.distinct(case((has_previous, ban.banned_user_id), else_=None))),
        ).one()
        ranking = query.with_entities(UserORM.user_id, UserORM.username, UserORM.deleted,
                                      func.count(ban.id).label("count"),
                                      func.max(case((has_previous, 1), else_=0)).label("repeat_offender"))\
            .group_by(UserORM.user_id, UserORM.username, UserORM.deleted)\
            .order_by(func.count(ban.id).desc(), UserORM.user_id).limit(ranking_limit).all()
        total = sum(count for _, count in outcomes)
        active = sum(count for reason, count in outcomes if reason == "active")
        return {
            "total": total, "active": active, "finalized": total - active,
            "banned_players": players, "repeat_offenders": repeat,
            "outcomes": [{"key": reason, "count": int(count)} for reason, count in outcomes],
            "top_players": [{"user_id": row.user_id, "username": "Cuenta eliminada" if row.deleted else row.username,
                             "deleted": row.deleted, "count": int(row.count), "repeat_offender": bool(row.repeat_offender)} for row in ranking],
        }

    def _appeals(self, start, end, as_of):
        appeal = BanAppealORM
        query = self._period(self.session.query(appeal), appeal.created_at, start, end, as_of)
        counts = dict(query.with_entities(appeal.status, func.count(appeal.id)).group_by(appeal.status).all())
        return {"total": sum(counts.values()), **{status: counts.get(status, 0) for status in ("pending", "accepted", "rejected")}}

    def _activity(self, start, end, as_of):
        activity = {}
        for model, key in ((PlayerReportORM, "reports"), (UserBanRecordORM, "bans")):
            column = model.created_at
            if self.session.get_bind().dialect.name == "postgresql":
                column = func.timezone("UTC", column)
            year, month = extract("year", column), extract("month", column)
            query = self._period(self.session.query(year, month, func.count(model.id)), model.created_at, start, end, as_of)
            for y, m, count in query.group_by(year, month).all():
                stamp = f"{int(y):04d}-{int(m):02d}"
                activity.setdefault(stamp, {"month": stamp, "reports": 0, "bans": 0})[key] = int(count)
        return [activity[month] for month in sorted(activity)]

    def query(self, start, end, as_of, ranking_limit):
        # Una instantánea de lectura evita mezclar decisiones concurrentes entre gráficos.
        if self.session.get_bind().dialect.name == "postgresql":
            self.session.connection(execution_options={"isolation_level": "REPEATABLE READ"})
        return {
            "reports": self._reports(start, end, as_of, ranking_limit),
            "bans": self._bans(start, end, as_of, ranking_limit),
            "appeals": self._appeals(start, end, as_of),
            "activity": self._activity(start, end, as_of),
        }
