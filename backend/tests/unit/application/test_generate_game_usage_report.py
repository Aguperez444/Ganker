from datetime import date, datetime
from unittest.mock import MagicMock

import pytest

from app.application.use_cases.generate_game_usage_report import GenerateGameUsageReport
from app.domain.exceptions.report.invalid_report_analysis_type_exception import InvalidReportAnalysisTypeException
from app.domain.exceptions.report.invalid_report_date_range_exception import InvalidReportDateRangeException
from app.domain.exceptions.report.no_usage_data_for_report_exception import NoUsageDataForReportException
from app.domain.exceptions.report.rank_bands_required_exception import RankBandsRequiredException
from app.domain.exceptions.report.report_start_date_before_previous_exception import \
    ReportStartDateBeforePreviousException
from app.domain.exceptions.videogame.videogame_not_found_exception import VideogameNotFoundException
from app.domain.models.character import Character
from app.domain.models.game_usage_report import GameUsageReport
from app.domain.models.game_usage_report_item import GameUsageReportItem
from app.domain.models.rank import Rank
from app.domain.models.videogame import Videogame
from app.infrastructure.api.dto.request.generate_game_usage_report_request import (
    GenerateGameUsageReportRequest,
    RankBandRequest,
)


def _videogame(videogame_id: int = 1, name: str = "League of Legends") -> Videogame:
    return Videogame(
        videogame_id=videogame_id,
        name=name,
        icon_url=f"/media/games/{videogame_id}.png",
        rank_per_role=True,
    )


def _rank(rank_id: int, name: str, value: int, videogame: Videogame) -> Rank:
    return Rank(rank_id=rank_id, name=name, value=value, videogame=videogame, icon_url=f"/media/ranks/{name}.png")


def _character(character_id: int, name: str, videogame: Videogame) -> Character:
    return Character(
        character_id=character_id,
        name=name,
        videogame=videogame,
        icon_url=f"/media/characters/{name}.png",
    )


def _previous_report(items=None, end_date: datetime | None = None, report_id: int = 99) -> GameUsageReport:
    items = items or []
    report_items = [
        GameUsageReportItem(
            item_id=index + 1, category_id=category_id, name=name, icon_url=None, count=count, percentage=0.0
        )
        for index, (category_id, name, count) in enumerate(items)
    ]
    return GameUsageReport(
        report_id=report_id,
        generated_by=1,
        analysis_type="ranks",
        videogame_id=1,
        videogame_name="League of Legends",
        icon_url=None,
        generated_at=datetime(2026, 1, 1, 12, 0, 0),
        total=sum(count for _, _, count in items),
        items=report_items,
        end_date=end_date,
    )


class TestGenerateGameUsageReportUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        for repo in (
            "videogame_repo",
            "role_profile_repo",
            "character_priority_repo",
            "team_repo",
            "game_profile_repo",
            "rank_repo",
            "game_usage_report_repo",
        ):
            setattr(uow, repo, MagicMock())

        uow.videogame_repo.get_videogame_by_id.return_value = _videogame()
        uow.game_usage_report_repo.get_latest_report.return_value = None

        def fake_create(report):
            report.report_id = 1
            return report

        uow.game_usage_report_repo.create_report.side_effect = fake_create
        use_case = GenerateGameUsageReport(unit_of_work=uow)
        return use_case, uow

    # ---------------------------------------------------------
    # tipos de análisis
    # ---------------------------------------------------------

    def test_generate_ranks_sorted_and_with_percentages(self, mock_deps):
        use_case, uow = mock_deps
        videogame = _videogame()
        uow.videogame_repo.get_videogame_by_id.return_value = videogame
        uow.role_profile_repo.get_rank_usage.return_value = [
            (_rank(1, "Gold", 1000, videogame), 2),
            (_rank(2, "Platinum", 2000, videogame), 1),
        ]
        uow.game_profile_repo.get_profile_counts_by_videogame.return_value = [(videogame, 3)]

        response = use_case.execute(
            GenerateGameUsageReportRequest(videogame_id=1, analysis_type="ranks"), admin_id=7
        )

        assert response.report_id == 1
        assert response.generated_by == 7
        assert response.analysis_type == "ranks"
        assert response.videogame_id == 1
        assert response.videogame_name == "League of Legends"
        assert response.total == 3
        assert [item.name for item in response.items] == ["Gold", "Platinum"]
        assert response.items[0].percentage == 66.67
        assert response.items[1].percentage == 33.33
        assert response.has_previous_report is False
        assert response.previous_report_id is None
        assert all(item.variation is None for item in response.items)
        assert all(item.trend is None for item in response.items)
        # La persistencia recibe el valor plano del tipo de análisis, no el enum
        assert uow.game_usage_report_repo.create_report.call_args.args[0].analysis_type == "ranks"

    def test_generate_characters(self, mock_deps):
        use_case, uow = mock_deps
        videogame = _videogame()
        uow.videogame_repo.get_videogame_by_id.return_value = videogame
        uow.character_priority_repo.get_character_usage.return_value = [
            (_character(1, "Ahri", videogame), 2),
            (_character(2, "Yasuo", videogame), 1),
        ]
        uow.game_profile_repo.get_profile_counts_by_videogame.return_value = [(videogame, 3)]

        response = use_case.execute(
            GenerateGameUsageReportRequest(videogame_id=1, analysis_type="characters"), admin_id=7
        )

        assert response.analysis_type == "characters"
        assert [item.name for item in response.items] == ["Ahri", "Yasuo"]
        assert response.items[0].category_id == 1
        assert response.total == 3

    def test_generate_teams_with_rank_bands(self, mock_deps):
        use_case, uow = mock_deps
        videogame = _videogame()
        uow.videogame_repo.get_videogame_by_id.return_value = videogame
        uow.team_repo.get_team_counts_by_min_rank.return_value = [(_rank(1, "Gold", 1000, videogame), 2)]
        ranks = {1: _rank(1, "Gold", 1000, videogame), 3: _rank(3, "Diamond", 3000, videogame)}
        uow.rank_repo.get_rank_by_id.side_effect = lambda rank_id: ranks[rank_id]

        request = GenerateGameUsageReportRequest(
            videogame_id=1,
            analysis_type="teams",
            rank_bands=[RankBandRequest(min_rank_id=1, max_rank_id=3)],
        )
        response = use_case.execute(request, admin_id=7)

        assert response.analysis_type == "teams"
        assert response.total == 2
        item = response.items[0]
        assert item.name == "Rango Gold - Diamond"
        assert item.rank_range == "1000 - 3000"
        assert item.category_id is None
        assert item.count == 2
        assert item.percentage == 100.0

    def test_generate_teams_without_rank_bands_raises(self, mock_deps):
        use_case, _ = mock_deps

        with pytest.raises(RankBandsRequiredException) as exc_info:
            use_case.execute(GenerateGameUsageReportRequest(videogame_id=1, analysis_type="teams"), admin_id=7)

        assert exc_info.value.status_code == 400

    def test_empty_analysis_type_defaults_to_ranks(self, mock_deps):
        use_case, uow = mock_deps
        videogame = _videogame()
        uow.role_profile_repo.get_rank_usage.return_value = [(_rank(1, "Gold", 1000, videogame), 1)]
        uow.game_profile_repo.get_profile_counts_by_videogame.return_value = [(videogame, 1)]

        response = use_case.execute(GenerateGameUsageReportRequest(videogame_id=1, analysis_type=""), admin_id=7)

        assert response.analysis_type == "ranks"

    def test_invalid_analysis_type_raises(self, mock_deps):
        use_case, _ = mock_deps

        with pytest.raises(InvalidReportAnalysisTypeException) as exc_info:
            use_case.execute(GenerateGameUsageReportRequest(videogame_id=1, analysis_type="pizza"), admin_id=7)

        assert exc_info.value.status_code == 400

    # ---------------------------------------------------------
    # validaciones
    # ---------------------------------------------------------

    def test_videogame_not_found_raises(self, mock_deps):
        use_case, uow = mock_deps
        uow.videogame_repo.get_videogame_by_id.return_value = None

        with pytest.raises(VideogameNotFoundException) as exc_info:
            use_case.execute(GenerateGameUsageReportRequest(videogame_id=999, analysis_type="ranks"), admin_id=7)

        assert exc_info.value.status_code == 404

    def test_invalid_date_range_raises(self, mock_deps):
        use_case, _ = mock_deps

        request = GenerateGameUsageReportRequest(
            videogame_id=1,
            analysis_type="ranks",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 5, 1),
        )
        with pytest.raises(InvalidReportDateRangeException):
            use_case.execute(request, admin_id=7)

    def test_start_before_previous_end_raises(self, mock_deps):
        use_case, uow = mock_deps
        uow.game_usage_report_repo.get_latest_report.return_value = _previous_report(
            end_date=datetime(2026, 5, 10, 23, 59, 59)
        )

        request = GenerateGameUsageReportRequest(videogame_id=1, analysis_type="ranks", start_date=date(2026, 5, 1))
        with pytest.raises(ReportStartDateBeforePreviousException):
            use_case.execute(request, admin_id=7)

    def test_without_data_raises_no_usage_data(self, mock_deps):
        use_case, uow = mock_deps
        videogame = _videogame()
        uow.videogame_repo.get_videogame_by_id.return_value = videogame
        uow.role_profile_repo.get_rank_usage.return_value = []
        uow.game_profile_repo.get_profile_counts_by_videogame.return_value = [(videogame, 0)]

        with pytest.raises(NoUsageDataForReportException) as exc_info:
            use_case.execute(GenerateGameUsageReportRequest(videogame_id=1, analysis_type="ranks"), admin_id=7)

        assert exc_info.value.status_code == 404
        assert "rangos" in exc_info.value.message
        uow.game_usage_report_repo.create_report.assert_not_called()

    # ---------------------------------------------------------
    # variación respecto al reporte previo
    # ---------------------------------------------------------

    def test_with_previous_report_calculates_variation(self, mock_deps):
        use_case, uow = mock_deps
        videogame = _videogame()
        uow.videogame_repo.get_videogame_by_id.return_value = videogame
        uow.game_usage_report_repo.get_latest_report.return_value = _previous_report(
            items=[(1, "Gold", 1), (2, "Platinum", 2)]
        )
        uow.role_profile_repo.get_rank_usage.return_value = [
            (_rank(1, "Gold", 1000, videogame), 2),
            (_rank(2, "Platinum", 2000, videogame), 1),
        ]
        uow.game_profile_repo.get_profile_counts_by_videogame.return_value = [(videogame, 3)]

        response = use_case.execute(
            GenerateGameUsageReportRequest(videogame_id=1, analysis_type="ranks"), admin_id=7
        )

        assert response.has_previous_report is True
        assert response.previous_report_id == 99

        gold = next(item for item in response.items if item.category_id == 1)
        assert gold.variation == 1
        assert gold.variation_percentage == 100.0
        assert gold.trend == "sube"

        platinum = next(item for item in response.items if item.category_id == 2)
        assert platinum.variation == -1
        assert platinum.variation_percentage == -50.0
        assert platinum.trend == "baja"
