from unittest.mock import MagicMock
import pytest

from app.application.use_cases.query_ranks import QueryRanks
from app.domain.models.rank import Rank
from app.domain.models.videogame import Videogame


class TestQueryRanksUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.rank_repo = MagicMock()

        use_case = QueryRanks(unit_of_work=uow)
        return use_case, uow

    def test_get_ranks_by_game_id_happy_path(self, mock_deps):
        use_case, uow = mock_deps

        vg = Videogame(1, "LoL", "/lol.png", True)
        ranks = [
            Rank(rank_id=1, name="Gold", value=1000, videogame=vg, icon_url="/gold.png"),
            Rank(rank_id=2, name="Platinum", value=2000, videogame=vg, icon_url=None),
        ]
        uow.rank_repo.get_ranks_by_game_id.return_value = ranks

        result = use_case.get_by_game_id(1)

        assert len(result.ranks) == 2
        assert result.ranks[0].rank_id == 1
        assert result.ranks[0].name == "Gold"
        assert result.ranks[0].value == 1000
        assert result.ranks[0].icon_url == "/gold.png"
        assert result.ranks[1].rank_id == 2
        assert result.ranks[1].name == "Platinum"
        assert result.ranks[1].icon_url == "Sin icono"

    def test_get_ranks_by_game_id_empty(self, mock_deps):
        use_case, uow = mock_deps
        uow.rank_repo.get_ranks_by_game_id.return_value = []

        result = use_case.get_by_game_id(999)
        assert result.ranks == []
