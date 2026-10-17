import pytest

from app.domain.models.report_analysis_type import ReportAnalysisType as AnalysisType


class TestReportAnalysisType:

    def test_values_are_the_supported_codes(self):
        assert AnalysisType.values() == ("ranks", "characters", "teams")

    def test_iteration_order_is_stable(self):
        assert [member.value for member in AnalysisType] == ["ranks", "characters", "teams"]

    def test_try_from_value_normalizes_whitespace_and_case(self):
        assert AnalysisType.try_from_value("  RANKS ") is AnalysisType.RANKS
        assert AnalysisType.try_from_value("Characters") is AnalysisType.CHARACTERS
        assert AnalysisType.try_from_value("teams") is AnalysisType.TEAMS

    @pytest.mark.parametrize("value", [None, "", "   ", "nope", "rank"])
    def test_try_from_value_returns_none_for_invalid(self, value):
        assert AnalysisType.try_from_value(value) is None

    def test_requires_rank_bands_only_for_teams(self):
        assert AnalysisType.RANKS.requires_rank_bands is False
        assert AnalysisType.CHARACTERS.requires_rank_bands is False
        assert AnalysisType.TEAMS.requires_rank_bands is True

    def test_label_and_description_are_present_for_every_type(self):
        for analysis_type in AnalysisType:
            assert analysis_type.label.strip()
            assert analysis_type.description.strip()

    def test_noun(self):
        assert AnalysisType.RANKS.noun == "rangos"
        assert AnalysisType.CHARACTERS.noun == "personajes"
        assert AnalysisType.TEAMS.noun == "equipos"

    def test_str_and_format_return_the_value(self):
        assert str(AnalysisType.RANKS) == "ranks"
        assert f"{AnalysisType.TEAMS}" == "teams"
