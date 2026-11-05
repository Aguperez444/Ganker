import os
from datetime import datetime, timedelta, timezone
from typing import BinaryIO, Optional

from app.domain.models.player_report import PlayerReport
from app.domain.models.report_status import ReportStatus
from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.services.youtube_url_service import YoutubeUrlService
from app.domain.exceptions.file.file_name_not_null_exception import FileNameNotNullException
from app.domain.exceptions.moderation.cannot_report_self_exception import CannotReportSelfException
from app.domain.exceptions.moderation.evidence_file_too_large_exception import EvidenceFileTooLargeException

from app.infrastructure.api.dto.response.report_player_response import ReportPlayerResponse

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.infrastructure.api.dto.request.report_player_request import ReportPlayerRequest

# Tamaño máximo de la imagen de evidencia (Nginx corta el body completo en 10 MB)
MAX_EVIDENCE_IMAGE_MB = 5
EVIDENCE_SUBFOLDER = "reports/evidence"


class ReportPlayer:
    def __init__(self, uow: IUnitOfWork, storage_service: IStorageService | None = None,
                 cooldown: timedelta = timedelta(hours=24)):
        self.uow = uow
        self.storage_service = storage_service
        self.cooldown = cooldown

    def execute(self, report_request: 'ReportPlayerRequest', reporter_id: int,
                evidence_file: Optional[BinaryIO] = None, evidence_filename: Optional[str] = None):

        with self.uow as uow:
            reporter = CatalogValidationService.get_and_validate_exist_user(reporter_id, uow)
            reported = CatalogValidationService.get_and_validate_exist_user(report_request.reported_id, uow)
            reason = CatalogValidationService.validate_reason_is_valid_for_report(report_request.reason)

            if reporter_id == report_request.reported_id:
                raise CannotReportSelfException()

            # El link de YouTube es opcional; si viene se guarda en formato canónico
            evidence_video_url = None
            if report_request.evidence_video_url and report_request.evidence_video_url.strip():
                evidence_video_url = YoutubeUrlService.normalize(report_request.evidence_video_url)

            evidence_image_url = None
            if evidence_file:
                evidence_image_url = self._save_evidence_image(evidence_file, evidence_filename)

            new_report = PlayerReport(
                report_id=None,
                reporter=reporter,
                reported=reported,
                reason=reason,
                description=report_request.description,
                status=ReportStatus.PENDING,
                created_at=datetime.now(timezone.utc),
                resolved_at=None,
                resolver_user=None,
                evidence_image_url=evidence_image_url,
                evidence_video_url=evidence_video_url,
            )

            try:
                new_report = uow.moderation_repo.report_player(new_report, self.cooldown)
            except Exception:
                # Si el reporte no se guarda (ej. cooldown), borro la imagen para no persistir basura
                if evidence_image_url is not None:
                    self.storage_service.delete_file(evidence_image_url)
                raise

            new_report = ReportPlayerResponse(
                report_id=new_report.report_id,
                reporter_id=new_report.reporter.user_id,
                reported_id=new_report.reported.user_id,
                status=new_report.status,
                reason=new_report.reason,
                description=new_report.description,
                created_at=new_report.created_at,
                evidence_image_url=new_report.evidence_image_url,
                evidence_video_url=new_report.evidence_video_url,
            )
            return new_report

    def _save_evidence_image(self, evidence_file: BinaryIO, evidence_filename: Optional[str]) -> str:
        if not evidence_filename:
            raise FileNameNotNullException()

        # Mido el archivo sin leerlo entero en memoria
        evidence_file.seek(0, os.SEEK_END)
        size = evidence_file.tell()
        evidence_file.seek(0)
        if size > MAX_EVIDENCE_IMAGE_MB * 1024 * 1024:
            raise EvidenceFileTooLargeException(MAX_EVIDENCE_IMAGE_MB)

        # El storage valida extensión y contenido real de la imagen
        return self.storage_service.save_image_file(
            file_content=evidence_file,
            filename=evidence_filename,
            subfolder=EVIDENCE_SUBFOLDER,
            preserve_original_name=False
        )
