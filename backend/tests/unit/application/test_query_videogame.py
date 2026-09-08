from unittest.mock import MagicMock
import pytest

from app.application.use_cases.query_videogames import QueryVideogames
from app.domain.models.videogame import Videogame


class TestQueryVideogamesUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.videogame_repo = MagicMock()

        use_case = QueryVideogames(unit_of_work=uow)
        return use_case, uow

    def test_get_all_videogames_happy_path(self, mock_deps):
        use_case, uow = mock_deps

        games = [
            Videogame(videogame_id=1, name="LoL", icon_url="/media/lol.png"),
            Videogame(videogame_id=2, name="Valorant", icon_url=None),
        ]
        uow.videogame_repo.get_all_videogames.return_value = games

        result = use_case.get_all_videogames()

        assert len(result.videogames) == 2
        assert result.videogames[0].id == 1
        assert result.videogames[0].name == "LoL"
        assert result.videogames[0].icon_url == "/media/lol.png"
        assert result.videogames[1].id == 2
        assert result.videogames[1].name == "Valorant"
        assert result.videogames[1].icon_url == "Sin icono"

    def test_get_all_videogames_empty(self, mock_deps):
        use_case, uow = mock_deps

        uow.videogame_repo.get_all_videogames.return_value = []

        result = use_case.get_all_videogames()

        assert result.videogames == []
