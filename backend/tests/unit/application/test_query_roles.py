from unittest.mock import MagicMock
import pytest

from app.application.use_cases.query_roles import QueryRoles
from app.domain.models.role import Role
from app.domain.models.videogame import Videogame


class TestQueryRolesUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.role_repo = MagicMock()

        use_case = QueryRoles(unit_of_work=uow)
        return use_case, uow

    def test_get_roles_by_game_id_happy_path(self, mock_deps):
        use_case, uow = mock_deps

        vg = Videogame(1, "LoL", "/lol.png")
        roles = [
            Role(role_id=1, name="Mid", videogame=vg, icon_url="/mid.png"),
            Role(role_id=2, name="Top", videogame=vg, icon_url=None),
        ]
        uow.role_repo.get_roles_by_game_id.return_value = roles

        result = use_case.get_by_game_id(1)

        assert len(result.roles) == 2
        assert result.roles[0].role_id == 1
        assert result.roles[0].name == "Mid"
        assert result.roles[0].icon_url == "/mid.png"
        assert result.roles[1].role_id == 2
        assert result.roles[1].name == "Top"
        assert result.roles[1].icon_url == "Sin icono"

    def test_get_roles_by_game_id_empty(self, mock_deps):
        use_case, uow = mock_deps
        uow.role_repo.get_roles_by_game_id.return_value = []

        result = use_case.get_by_game_id(999)
        assert result.roles == []
