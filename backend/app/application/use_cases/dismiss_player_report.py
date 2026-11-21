from datetime import datetime, timezone

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.moderation.cannot_dismiss_report_exception import CannotDismissReportException
from app.domain.exceptions.moderation.report_already_closed_exception import ReportAlreadyClosedException
from app.domain.exceptions.report.report_not_found_exception import ReportNotFoundException
from app.domain.models.report_status import ReportStatus
from app.domain.models.user_role import UserRole
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.infrastructure.api.dto.response.search_reported_players_response import SearchReportedPlayersResponse


class DismissPlayerReport:
    def __init__(self, uow: IUnitOfWork):
        self.uow = uow

    def execute(self, report_id: int, admin_id: int):
        with self.uow as uow:
            actor = CatalogValidationService.get_and_validate_exist_user(admin_id, uow)
            if actor.role not in (UserRole.ADMIN, UserRole.OWNER):
                raise CannotDismissReportException()
            report = uow.moderation_repo.get_report_for_resolution(report_id)
            if report is None:
                raise ReportNotFoundException(report_id)
            if report.status != ReportStatus.PENDING:
                raise ReportAlreadyClosedException()
            report.status = ReportStatus.REJECTED
            report.resolved_at = datetime.now(timezone.utc)
            report.resolver_user = actor
            uow.moderation_repo.dismiss_report(report)
            return SearchReportedPlayersResponse(
                id=report.report_id, reported_user_id=report.reported.user_id,
                reported_user_name=report.reported.username,
                reporter_user_id=report.reporter.user_id, reporter_user_name=report.reporter.username,
                status=report.status, reason=report.reason, description=report.description,
                created_at=report.created_at, resolved_at=report.resolved_at, resolved_by=actor.username,
                evidence_image_url=report.evidence_image_url, evidence_video_url=report.evidence_video_url,
                videogame_id=report.videogame.videogame_id if report.videogame else None,
                videogame_name=report.videogame.name if report.videogame else None,
            )
