from datetime import datetime

import pytest

from app.domain.exceptions.report.report_start_date_before_previous_exception import \
    ReportStartDateBeforePreviousException
from app.domain.services.report_period_service import ReportPeriodService


class TestReportPeriodService:

    def test_no_start_date_does_not_validate(self):
        ReportPeriodService.validate_start_not_before_previous(None, datetime(2026, 1, 1))

    def test_no_previous_end_date_does_not_validate(self):
        ReportPeriodService.validate_start_not_before_previous(datetime(2026, 1, 1), None)

    def test_start_equal_to_previous_end_is_allowed(self):
        moment = datetime(2026, 5, 10, 23, 59, 59)
        ReportPeriodService.validate_start_not_before_previous(moment, moment)

    def test_start_after_previous_end_is_allowed(self):
        ReportPeriodService.validate_start_not_before_previous(
            datetime(2026, 5, 11), datetime(2026, 5, 10, 23, 59, 59)
        )

    def test_start_before_previous_end_raises(self):
        previous_end = datetime(2026, 5, 10, 23, 59, 59)

        with pytest.raises(ReportStartDateBeforePreviousException) as exc_info:
            ReportPeriodService.validate_start_not_before_previous(datetime(2026, 5, 1), previous_end)

        assert exc_info.value.status_code == 400
        assert "fecha inicial" in exc_info.value.message.lower()
        assert "2026-05-10" in exc_info.value.message
