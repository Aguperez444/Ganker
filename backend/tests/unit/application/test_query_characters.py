from unittest.mock import MagicMock
import pytest

from app.application.use_cases.query_characters import QueryCharacters
from app.domain.models.character import Character
from app.domain.models.videogame import Videogame


class TestQueryCharactersUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.character_repo = MagicMock()

        use_case = QueryCharacters(unit_of_work=uow)
        return use_case, uow

    def test_get_characters_by_game_id_happy_path(self, mock_deps):
        use_case, uow = mock_deps

        vg = Videogame(1, "LoL", "/lol.png", True)
        chars = [
            Character(character_id=1, name="Ahri", videogame=vg, icon_url="/ahri.png"),
            Character(character_id=2, name="Yasuo", videogame=vg, icon_url=None),
        ]
        uow.character_repo.get_characters_by_game_id.return_value = chars

        result = use_case.get_by_game_id(1)

        assert len(result.characters) == 2
        assert result.characters[0].character_id == 1
        assert result.characters[0].name == "Ahri"
        assert result.characters[0].icon_url == "/ahri.png"
        assert result.characters[1].character_id == 2
        assert result.characters[1].name == "Yasuo"
        assert result.characters[1].icon_url == "Sin icono"

    def test_get_characters_by_game_id_empty(self, mock_deps):
        use_case, uow = mock_deps
        uow.character_repo.get_characters_by_game_id.return_value = []

        result = use_case.get_by_game_id(999)
        assert result.characters == []
