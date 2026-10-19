from datetime import datetime, timezone

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.moderation.not_can_auto_report_exception import NotCanAutoReportException
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.infrastructure.api.dto.response.report_player_response import ReportPlayerResponse
from app.infrastructure.database.models.player_report_orm import PlayerReportORM


class ReportPlayer:
    def __init__ (self, uow: IUnitOfWork):
        self.uow = uow

    def execute(self, report_request, reporter_id: int):

        with self.uow as uow:
            CatalogValidationService.get_and_validate_exist_user(reporter_id, uow)
            CatalogValidationService.get_and_validate_exist_user(report_request.reported_id, uow)
            CatalogValidationService.validate_reason_is_valid_for_report(report_request.reason)

            if reporter_id == report_request.reported_id:
                raise NotCanAutoReportException()

            new_report = PlayerReportORM(
                reporter_id=reporter_id,
                reported_id=report_request.reported_id,
                reason=report_request.reason,
                description=report_request.description,
            )

            new_report = uow.moderation_repo.report_player(new_report)
            new_report = ReportPlayerResponse(
                id=new_report.id,
                reporter_id=new_report.reporter_id,
                reported_id=new_report.reported_id,
                status=new_report.status,
                reason=new_report.reason,
                description=new_report.description,
                create_at=new_report.create_at
            )
            return new_report