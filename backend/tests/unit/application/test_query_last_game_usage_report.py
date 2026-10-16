from datetime import date, datetime
from unittest.mock import MagicMock

import pytest

from app.application.use_cases.query_last_game_usage_report import QueryLastGameUsageReport
from app.domain.exceptions.report.invalid_report_analysis_type_exception import InvalidReportAnalysisTypeException
from app.domain.models.game_usage_report import GameUsageReport


def _report(end_date: datetime | None = None, report_id: int = 5) -> GameUsageReport:
    return GameUsageReport(
        report_id=report_id,
        generated_by=1,
        analysis_type="ranks",
        videogame_id=1,
        videogame_name="League of Legends",
        icon_url=None,
        generated_at=datetime(2026, 6, 30, 12, 0, 0),
        total=10,
        items=[],
        start_date=datetime(2026, 6, 1, 0, 0, 0) if end_date else None,
        end_date=end_date,
    )


class TestQueryLastGameUsageReportUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.game_usage_report_repo = MagicMock()
        use_case = QueryLastGameUsageReport(unit_of_work=uow)
        return use_case, uow

    def test_without_report(self, mock_deps):
        use_case, uow = mock_deps
        uow.game_usage_report_repo.get_latest_report.return_value = None

        response = use_case.execute(1, "ranks")

        assert response.has_report is False
        assert response.report_id is None
        assert response.end_date is None
        assert response.suggested_start_date is None

    def test_with_report_suggests_the_next_day(self, mock_deps):
        use_case, uow = mock_deps
        uow.game_usage_report_repo.get_latest_report.return_value = _report(end_date=datetime(2026, 6, 30, 23, 59, 59))

        response = use_case.execute(1, "ranks")

        assert response.has_report is True
        assert response.report_id == 5
        assert response.analysis_type == "ranks"
        assert response.total == 10
        assert response.end_date == datetime(2026, 6, 30, 23, 59, 59)
        assert response.suggested_start_date == date(2026, 7, 1)

    def test_historical_report_has_no_suggested_date(self, mock_deps):
        use_case, uow = mock_deps
        uow.game_usage_report_repo.get_latest_report.return_value = _report(end_date=None)

        response = use_case.execute(1, "ranks")

        assert response.has_report is True
        assert response.suggested_start_date is None

    def test_normalizes_analysis_type(self, mock_deps):
        use_case, uow = mock_deps
        uow.game_usage_report_repo.get_latest_report.return_value = None

        use_case.execute(3, "  CharacterS ")

        uow.game_usage_report_repo.get_latest_report.assert_called_once_with(3, "characters")

    def test_invalid_analysis_type_raises(self, mock_deps):
        use_case, _ = mock_deps

        with pytest.raises(InvalidReportAnalysisTypeException) as exc_info:
            use_case.execute(1, "nope")

        assert exc_info.value.status_code == 400
