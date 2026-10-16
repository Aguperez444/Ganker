from app.application.use_cases.query_game_usage_analysis_types import QueryGameUsageAnalysisTypes


class TestQueryGameUsageAnalysisTypesUseCase:

    def test_returns_catalog_in_enum_order(self):
        response = QueryGameUsageAnalysisTypes().execute()

        assert [entry.value for entry in response.analysis_types] == ["ranks", "characters", "teams"]

    def test_each_entry_has_label_and_description(self):
        response = QueryGameUsageAnalysisTypes().execute()

        for entry in response.analysis_types:
            assert entry.label.strip()
            assert entry.description.strip()

    def test_only_teams_requires_rank_bands(self):
        response = QueryGameUsageAnalysisTypes().execute()
        by_value = {entry.value: entry for entry in response.analysis_types}

        assert by_value["teams"].requires_rank_bands is True
        assert by_value["ranks"].requires_rank_bands is False
        assert by_value["characters"].requires_rank_bands is False
