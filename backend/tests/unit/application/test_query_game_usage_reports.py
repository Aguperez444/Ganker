from datetime import datetime
from unittest.mock import MagicMock

import pytest

from app.application.use_cases.query_game_usage_reports import QueryGameUsageReports
from app.domain.exceptions.report.invalid_report_analysis_type_exception import InvalidReportAnalysisTypeException
from app.domain.models.game_usage_report import GameUsageReport


def _report(report_id: int, analysis_type: str = "ranks", start_date=None, end_date=None) -> GameUsageReport:
    return GameUsageReport(
        report_id=report_id,
        generated_by=1,
        analysis_type=analysis_type,
        videogame_id=1,
        videogame_name="League of Legends",
        icon_url=None,
        generated_at=datetime(2026, 6, 30, 12, 0, 0),
        total=10,
        items=[],
        start_date=start_date,
        end_date=end_date,
    )


class TestQueryGameUsageReportsUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.game_usage_report_repo = MagicMock()
        use_case = QueryGameUsageReports(unit_of_work=uow)
        return use_case, uow

    def test_list_preserves_order_and_fields(self, mock_deps):
        use_case, uow = mock_deps
        uow.game_usage_report_repo.get_all_reports.return_value = [
            _report(2, start_date=datetime(2026, 7, 1), end_date=datetime(2026, 7, 31)),
            _report(1),
        ]

        response = use_case.execute()

        assert [report.report_id for report in response.reports] == [2, 1]
        assert response.reports[0].analysis_type == "ranks"
        assert response.reports[0].start_date == datetime(2026, 7, 1)
        assert response.reports[1].start_date is None

    def test_list_empty(self, mock_deps):
        use_case, uow = mock_deps
        uow.game_usage_report_repo.get_all_reports.return_value = []

        assert use_case.execute().reports == []

    def test_without_filters_passes_none(self, mock_deps):
        use_case, uow = mock_deps
        uow.game_usage_report_repo.get_all_reports.return_value = []

        use_case.execute()

        uow.game_usage_report_repo.get_all_reports.assert_called_once_with(None, None)

    def test_normalizes_analysis_type_filter(self, mock_deps):
        use_case, uow = mock_deps
        uow.game_usage_report_repo.get_all_reports.return_value = []

        use_case.execute(videogame_id=1, analysis_type="  RANKS ")

        uow.game_usage_report_repo.get_all_reports.assert_called_once_with(1, "ranks")

    def test_invalid_analysis_type_raises(self, mock_deps):
        use_case, _ = mock_deps

        with pytest.raises(InvalidReportAnalysisTypeException) as exc_info:
            use_case.execute(analysis_type="nope")

        assert exc_info.value.status_code == 400
