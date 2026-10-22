from app.infrastructure.database.mappers.user_mapper import UserMapper
from app.infrastructure.database.models.player_report_orm import PlayerReportORM
from app.domain.models.player_report import PlayerReport
from app.domain.models.report_reason import ReportReason
from app.domain.models.report_status import ReportStatus


class PlayerReportMapper:
    @staticmethod
    def orm_to_domain(player_report_orm: PlayerReportORM) -> PlayerReport:
        return PlayerReport(
            report_id=player_report_orm.id,
            reporter=UserMapper.orm_to_domain(player_report_orm.reporter),
            reported=UserMapper.orm_to_domain(player_report_orm.reported),
            reason=ReportReason(player_report_orm.reason.lower()),
            description=player_report_orm.description,
            status=ReportStatus(player_report_orm.status.lower()),
            created_at=player_report_orm.created_at,
            resolved_at=player_report_orm.resolved_at,
            resolver_user=UserMapper.orm_to_domain(player_report_orm.resolver_user) if player_report_orm.resolver_user else None
        )

    @staticmethod
    def domain_to_orm(player_report: PlayerReport) -> PlayerReportORM:
        if not player_report.is_persisted():
            return PlayerReportORM(
                reporter_id=player_report.reporter.user_id,
                reported_id=player_report.reported.user_id,
                reason=player_report.reason,
                description=player_report.description,
                status=player_report.status,
                created_at=player_report.created_at,
                resolved_at=player_report.resolved_at,
                resolver_id=player_report.resolver_user.user_id if player_report.resolver_user else None
            )
        return PlayerReportORM(
            id=player_report.report_id,
            reporter_id=player_report.reporter.user_id,
            reported_id=player_report.reported.user_id,
            reason=player_report.reason,
            description=player_report.description,
            status=player_report.status,
            created_at=player_report.created_at,
            resolved_at=player_report.resolved_at,
            resolver_id=player_report.resolver_user.user_id if player_report.resolver_user else None
        )