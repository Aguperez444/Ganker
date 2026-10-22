from datetime import datetime, timezone

from app.domain.models.player_report import PlayerReport
from app.domain.models.report_status import ReportStatus
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.exceptions.moderation.cannot_report_self_exception import CannotReportSelfException

from app.infrastructure.api.dto.response.report_player_response import ReportPlayerResponse

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.infrastructure.api.dto.request.report_player_request import ReportPlayerRequest


class ReportPlayer:
    def __init__ (self, uow: IUnitOfWork):
        self.uow = uow

    def execute(self, report_request: 'ReportPlayerRequest', reporter_id: int):

        with self.uow as uow:
            reporter = CatalogValidationService.get_and_validate_exist_user(reporter_id, uow)
            reported = CatalogValidationService.get_and_validate_exist_user(report_request.reported_id, uow)
            reason = CatalogValidationService.validate_reason_is_valid_for_report(report_request.reason)

            if reporter_id == report_request.reported_id:
                raise CannotReportSelfException()

            new_report = PlayerReport(
                report_id=None,
                reporter=reporter,
                reported=reported,
                reason=reason,
                description=report_request.description,
                status=ReportStatus.PENDING,
                created_at=datetime.now(timezone.utc),
                resolved_at=None,
                resolver_user=None
            )

            new_report = uow.moderation_repo.report_player(new_report)

            new_report = ReportPlayerResponse(
                report_id=new_report.report_id,
                reporter_id=new_report.reporter.user_id,
                reported_id=new_report.reported.user_id,
                status=new_report.status,
                reason=new_report.reason,
                description=new_report.description,
                created_at=new_report.created_at
            )
            return new_report