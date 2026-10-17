from datetime import datetime
from unittest.mock import MagicMock

import pytest

from app.application.use_cases.query_game_profile_reports import QueryGameProfileReports
from app.domain.models.game_profile_report import GameProfileReport
from app.domain.models.game_profile_report_item import GameProfileReportItem


def _report(report_id: int, start_date=None, end_date=None) -> GameProfileReport:
    return GameProfileReport(
        report_id=report_id,
        generated_by=1,
        generated_at=datetime(2026, 6, 30, 12, 0, 0),
        total_profiles=10,
        items=[
            GameProfileReportItem(
                item_id=1, videogame_id=1, videogame_name="LoL", icon_url=None,
                profile_count=10, percentage=100.0,
            )
        ],
        start_date=start_date,
        end_date=end_date,
    )


class TestQueryGameProfileReportsUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.game_profile_report_repo = MagicMock()
        use_case = QueryGameProfileReports(unit_of_work=uow)
        return use_case, uow

    def test_list_reports_preserves_order_and_fields(self, mock_deps):
        use_case, uow = mock_deps
        uow.game_profile_report_repo.get_all_reports.return_value = [
            _report(2, start_date=datetime(2026, 7, 1), end_date=datetime(2026, 7, 31)),
            _report(1),
        ]

        response = use_case.execute()

        assert [r.report_id for r in response.reports] == [2, 1]
        assert response.reports[0].start_date == datetime(2026, 7, 1)
        assert response.reports[0].end_date == datetime(2026, 7, 31)
        assert response.reports[1].start_date is None
        assert response.reports[1].end_date is None

    def test_list_reports_empty(self, mock_deps):
        use_case, uow = mock_deps
        uow.game_profile_report_repo.get_all_reports.return_value = []

        response = use_case.execute()

        assert response.reports == []
