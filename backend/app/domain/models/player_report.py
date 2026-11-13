from datetime import datetime

from typing import TYPE_CHECKING

from app.domain.exceptions.entity_not_persisted_exception import EntityNotPersistedException

if TYPE_CHECKING:
    from app.domain.models.user import User
    from app.domain.models.report_status import ReportStatus
    from app.domain.models.report_reason import ReportReason


class PlayerReport:
    def __init__(self, report_id: int|None, reporter: 'User', reported: 'User', status: 'ReportStatus', reason: 'ReportReason',
                 description: str | None, created_at: datetime, resolved_at: datetime | None, resolver_user: User | None,
                 evidence_image_url: str | None = None, evidence_video_url: str | None = None):
        self._report_id: int|None = report_id
        self._reporter: 'User' = reporter
        self._reported: 'User' = reported
        self._status: 'ReportStatus' = status
        self._reason: 'ReportReason' = reason
        self._description: str | None = description
        self._created_at: datetime = created_at
        self._resolved_at: datetime | None = resolved_at
        self._resolver_user: User | None = resolver_user
        self._evidence_image_url: str | None = evidence_image_url
        self._evidence_video_url: str | None = evidence_video_url

    @property
    def report_id(self) -> int:
        if self._report_id is None:
            raise EntityNotPersistedException("User")
        return self._report_id
    @report_id.setter
    def report_id(self, value: int):
        self._report_id = value

    @property
    def reporter(self) -> 'User':
        return self._reporter
    @reporter.setter
    def reporter(self, value: 'User'):
        self._reporter = value

    @property
    def reported(self) -> 'User':
        return self._reported
    @reported.setter
    def reported(self, value: 'User'):
        self._reported = value

    @property
    def status(self) -> 'ReportStatus':
        return self._status
    @status.setter
    def status(self, value: 'ReportStatus'):
        self._status = value

    @property
    def reason(self) -> 'ReportReason':
        return self._reason
    @reason.setter
    def reason(self, value: 'ReportReason'):
        self._reason = value

    @property
    def description(self) -> str | None:
        return self._description
    @description.setter
    def description(self, value: str | None):
        self._description = value

    @property
    def created_at(self) -> datetime:
        return self._created_at
    @created_at.setter
    def created_at(self, value: datetime):
        self._created_at = value

    @property
    def resolved_at(self) -> datetime | None:
        return self._resolved_at
    @resolved_at.setter
    def resolved_at(self, value: datetime):
        self._resolved_at = value

    @property
    def resolver_user(self) -> User | None:
        return self._resolver_user
    @resolver_user.setter
    def resolver_user(self, value: User):
        self._resolver_user = value

    @property
    def evidence_image_url(self) -> str | None:
        return self._evidence_image_url
    @evidence_image_url.setter
    def evidence_image_url(self, value: str | None):
        self._evidence_image_url = value

    @property
    def evidence_video_url(self) -> str | None:
        return self._evidence_video_url
    @evidence_video_url.setter
    def evidence_video_url(self, value: str | None):
        self._evidence_video_url = value

    def is_persisted(self) -> bool:
        return self._report_id is not None
