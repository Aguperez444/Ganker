from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock

from app.application.use_cases.query_cross_reports import QueryCrossReports


def test_cross_reports_normalize_reference_timezone_before_calculating_the_window():
    uow = MagicMock()
    uow.__enter__.return_value = uow
    uow.moderation_repo.get_player_report.return_value = SimpleNamespace(
        report_id=3, reporter=SimpleNamespace(user_id=1), reported=SimpleNamespace(user_id=2),
        created_at=datetime(2026, 11, 16, 9, tzinfo=timezone(timedelta(hours=-3))),
    )
    uow.moderation_repo.get_cross_reports.return_value = []
    result = QueryCrossReports(uow).execute(3, skip=10, limit=11)
    uow.moderation_repo.get_cross_reports.assert_called_once_with(
        2, 1, datetime(2026, 11, 14, 12, tzinfo=timezone.utc),
        datetime(2026, 11, 18, 12, tzinfo=timezone.utc), 10, 11,
    )
    assert result.reference_created_at == datetime(2026, 11, 16, 12, tzinfo=timezone.utc)
