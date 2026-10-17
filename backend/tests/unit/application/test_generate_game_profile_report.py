from datetime import date, datetime
from unittest.mock import MagicMock

import pytest

from app.application.use_cases.generate_game_profile_report import GenerateGameProfileReport
from app.domain.exceptions.report.invalid_report_date_range_exception import InvalidReportDateRangeException
from app.domain.exceptions.report.no_data_for_report_exception import NoDataForReportException
from app.domain.exceptions.report.report_start_date_before_previous_exception import \
    ReportStartDateBeforePreviousException
from app.domain.models.game_profile_report import GameProfileReport
from app.domain.models.game_profile_report_item import GameProfileReportItem
from app.domain.models.videogame import Videogame
from app.infrastructure.api.dto.request.generate_game_profile_report_request import GenerateGameProfileReportRequest


def _videogame(videogame_id: int, name: str) -> Videogame:
    return Videogame(
        videogame_id=videogame_id,
        name=name,
        icon_url=f"/media/games/{videogame_id}.png",
        rank_per_role=False,
    )


def _previous_report(items: list[tuple[int, int]], end_date: datetime | None = None) -> GameProfileReport:
    report_items = [
        GameProfileReportItem(
            item_id=index + 1,
            videogame_id=videogame_id,
            videogame_name=f"Game {videogame_id}",
            icon_url=None,
            profile_count=count,
            percentage=0.0,
        )
        for index, (videogame_id, count) in enumerate(items)
    ]
    return GameProfileReport(
        report_id=99,
        generated_by=1,
        generated_at=datetime(2026, 1, 1, 12, 0, 0),
        total_profiles=sum(count for _, count in items),
        items=report_items,
        end_date=end_date,
    )


class TestGenerateGameProfileReportUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.game_profile_repo = MagicMock()
        uow.game_profile_report_repo = MagicMock()

        # Simula la persistencia asignando un id al reporte recién creado
        def fake_create(report):
            report.report_id = 1
            return report

        uow.game_profile_report_repo.create_report.side_effect = fake_create

        use_case = GenerateGameProfileReport(unit_of_work=uow)
        return use_case, uow

    def test_generate_report_sorted_and_with_percentages(self, mock_deps):
        use_case, uow = mock_deps
        uow.game_profile_report_repo.get_latest_report.return_value = None
        uow.game_profile_repo.get_profile_counts_by_videogame.return_value = [
            (_videogame(1, "League of Legends"), 3),
            (_videogame(2, "Valorant"), 1),
            (_videogame(3, "Counter-Strike 2"), 0),
        ]

        response = use_case.execute(GenerateGameProfileReportRequest(), admin_id=7)

        assert response.report_id == 1
        assert response.generated_by == 7
        assert response.total_profiles == 4
        assert response.has_previous_report is False
        assert response.previous_report_id is None
        # Orden descendente por popularidad
        assert [item.videogame_name for item in response.items] == [
            "League of Legends", "Valorant", "Counter-Strike 2"
        ]
        assert response.items[0].percentage == 75.0
        assert response.items[1].percentage == 25.0
        assert response.items[2].percentage == 0.0
        # Sin reporte previo no hay variación
        assert all(item.variation is None for item in response.items)
        assert all(item.trend is None for item in response.items)

    def test_generate_report_with_previous_report_calculates_variation(self, mock_deps):
        use_case, uow = mock_deps
        uow.game_profile_report_repo.get_latest_report.return_value = _previous_report([(1, 2), (2, 1)])
        uow.game_profile_repo.get_profile_counts_by_videogame.return_value = [
            (_videogame(1, "League of Legends"), 3),
            (_videogame(2, "Valorant"), 1),
        ]

        response = use_case.execute(GenerateGameProfileReportRequest(), admin_id=7)

        assert response.has_previous_report is True
        assert response.previous_report_id == 99

        lol = next(item for item in response.items if item.videogame_id == 1)
        valorant = next(item for item in response.items if item.videogame_id == 2)

        assert lol.variation == 1
        assert lol.variation_percentage == 50.0
        assert lol.trend == "sube"

        assert valorant.variation == 0
        assert valorant.variation_percentage == 0.0
        assert valorant.trend == "estable"

    def test_generate_report_without_profiles_raises_no_data(self, mock_deps):
        use_case, uow = mock_deps
        uow.game_profile_report_repo.get_latest_report.return_value = None
        uow.game_profile_repo.get_profile_counts_by_videogame.return_value = [
            (_videogame(1, "League of Legends"), 0),
        ]

        with pytest.raises(NoDataForReportException):
            use_case.execute(GenerateGameProfileReportRequest(), admin_id=7)

        uow.game_profile_report_repo.create_report.assert_not_called()

    def test_generate_report_start_before_previous_end_raises(self, mock_deps):
        use_case, uow = mock_deps
        previous_end = datetime(2026, 5, 10, 23, 59, 59)
        uow.game_profile_report_repo.get_latest_report.return_value = _previous_report([(1, 2)], end_date=previous_end)

        request = GenerateGameProfileReportRequest(start_date=date(2026, 5, 1))

        with pytest.raises(ReportStartDateBeforePreviousException):
            use_case.execute(request, admin_id=7)

    def test_generate_report_start_equal_to_previous_end_is_allowed(self, mock_deps):
        use_case, uow = mock_deps
        previous_end = datetime(2026, 5, 10, 23, 59, 59)
        uow.game_profile_report_repo.get_latest_report.return_value = _previous_report([(1, 2)], end_date=previous_end)
        uow.game_profile_repo.get_profile_counts_by_videogame.return_value = [(_videogame(1, "League of Legends"), 2)]

        request = GenerateGameProfileReportRequest(start_date=date(2026, 5, 11))
        response = use_case.execute(request, admin_id=7)

        assert response.has_previous_report is True

    def test_generate_report_invalid_date_range_raises(self, mock_deps):
        use_case, uow = mock_deps

        request = GenerateGameProfileReportRequest(
            start_date=date(2026, 6, 1),
            end_date=date(2026, 5, 1),
        )

        with pytest.raises(InvalidReportDateRangeException):
            use_case.execute(request, admin_id=7)
