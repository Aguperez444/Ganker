from datetime import timedelta, timezone

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.moderation.player_report_not_found_exception import (
    PlayerReportNotFoundException,
)
from app.infrastructure.api.dto.response.cross_reports_response import CrossReportsResponse
from app.infrastructure.api.dto.response.search_reported_players_response import SearchReportedPlayersResponse

CROSS_REPORT_WINDOW_HOURS = 48


class QueryCrossReports:
    def __init__(self, uow: IUnitOfWork):
        self.uow = uow

    def execute(self, report_id: int, skip: int = 0, limit: int = 10):
        with self.uow as uow:
            reference = uow.moderation_repo.get_player_report(report_id)
            if reference is None:
                raise PlayerReportNotFoundException()
            created = reference.created_at
            created = created.replace(tzinfo=timezone.utc) if created.tzinfo is None else created.astimezone(timezone.utc)
            window = timedelta(hours=CROSS_REPORT_WINDOW_HOURS)
            start, end = created - window, created + window
            # Invierte exactamente los participantes de la denuncia de referencia.
            reports = uow.moderation_repo.get_cross_reports(
                reference.reported.user_id, reference.reporter.user_id, start, end, skip, limit,
            )
            return CrossReportsResponse(
                report_id=reference.report_id, window_hours=CROSS_REPORT_WINDOW_HOURS,
                reference_created_at=created, window_start=start, window_end=end,
                reports=[SearchReportedPlayersResponse(
                    id=report.report_id, reported_user_id=report.reported.user_id,
                    reported_user_name=report.reported.username,
                    reporter_user_id=report.reporter.user_id, reporter_user_name=report.reporter.username,
                    status=report.status, reason=report.reason, description=report.description,
                    created_at=report.created_at, resolved_at=report.resolved_at,
                    resolved_by=report.resolver_user.username if report.resolver_user else None,
                    evidence_image_url=report.evidence_image_url, evidence_video_url=report.evidence_video_url,
                    videogame_id=report.videogame.videogame_id if report.videogame else None,
                    videogame_name=report.videogame.name if report.videogame else None,
                ) for report in reports],
            )
