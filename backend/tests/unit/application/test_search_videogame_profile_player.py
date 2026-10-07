from unittest.mock import MagicMock
import pytest

from app.application.use_cases.search_videogame_profile_player import SearchVideogameProfilePlayer
from app.domain.models.videogame import Videogame
from app.domain.models.role import Role
from app.domain.models.rank import Rank
from app.domain.models.character import Character
from app.domain.exceptions.videogame.videogame_not_found_exception import VideogameNotFoundException
from app.domain.exceptions.role.role_not_found_exception import RoleNotFoundException
from app.domain.exceptions.rank.rank_not_found_exception import RankNotFoundException
from app.domain.exceptions.character.character_not_found_exception import CharacterNotFoundException
from app.infrastructure.api.dto.request.Search_videogame_profiles_request import SearchVideogameProfilesRequest


class TestSearchVideogameProfilePlayerUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.videogame_repo = MagicMock()
        uow.role_repo = MagicMock()
        uow.rank_repo = MagicMock()
        uow.character_repo = MagicMock()
        uow.find_by_specification_repo = MagicMock()

        use_case = SearchVideogameProfilePlayer(unit_of_work=uow)
        return use_case, uow

    def test_search_videogame_profile_happy_path(self, mock_deps):
        use_case, uow = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/lol.png", rank_per_role=True)
        role = Role(role_id=10, name="Mid", videogame=vg, icon_url="/mid.png")
        rank = Rank(rank_id=20, name="Gold", value=1000, videogame=vg, icon_url="/gold.png")
        char = Character(character_id=30, name="Ahri", videogame=vg, icon_url="/ahri.png")

        uow.videogame_repo.get_videogame_by_id.return_value = vg
        uow.role_repo.get_role_by_id.return_value = role
        uow.rank_repo.get_rank_by_id.return_value = rank
        uow.character_repo.get_character_by_id.return_value = char
        uow.find_by_specification_repo.get_videogame_profiles.return_value = []

        filters = SearchVideogameProfilesRequest(
            videogame_id=1,
            roles=[10],
            ranks=[20],
            characters=[30],
            name="JohnDoe",
            page=2,
            page_size=10
        )

        result = use_case.execute(filters=filters, player_id=99)

        assert result.videogame_profiles == []
        uow.videogame_repo.get_videogame_by_id.assert_called_once_with(1)
        uow.role_repo.get_role_by_id.assert_called_once_with(10)
        uow.rank_repo.get_rank_by_id.assert_called_once_with(20)
        uow.character_repo.get_character_by_id.assert_called_once_with(30)
        uow.find_by_specification_repo.get_videogame_profiles.assert_called_once()
        # skip should be (2-1)*10 = 10, limit = 10
        _, args, _ = uow.find_by_specification_repo.get_videogame_profiles.mock_calls[0]
        assert args[1] == 10
        assert args[2] == 10

    def test_search_videogame_not_found(self, mock_deps):
        use_case, uow = mock_deps
        uow.videogame_repo.get_videogame_by_id.return_value = None

        filters = SearchVideogameProfilesRequest(videogame_id=999)

        with pytest.raises(VideogameNotFoundException) as exc_info:
            use_case.execute(filters=filters, player_id=1)

        assert exc_info.value.status_code == 404

    def test_search_role_not_found_raises_role_not_found(self, mock_deps):
        use_case, uow = mock_deps
        vg = Videogame(videogame_id=1, name="LoL", icon_url="/lol.png", rank_per_role=True)
        uow.videogame_repo.get_videogame_by_id.return_value = vg
        uow.role_repo.get_role_by_id.return_value = None

        filters = SearchVideogameProfilesRequest(videogame_id=1, roles=[999])

        with pytest.raises(RoleNotFoundException) as exc_info:
            use_case.execute(filters=filters, player_id=1)

        assert exc_info.value.status_code == 404

    def test_search_rank_not_found_raises_rank_not_found(self, mock_deps):
        use_case, uow = mock_deps
        vg = Videogame(videogame_id=1, name="LoL", icon_url="/lol.png", rank_per_role=True)
        uow.videogame_repo.get_videogame_by_id.return_value = vg
        uow.rank_repo.get_rank_by_id.return_value = None

        filters = SearchVideogameProfilesRequest(videogame_id=1, ranks=[999])

        with pytest.raises(RankNotFoundException) as exc_info:
            use_case.execute(filters=filters, player_id=1)

        assert exc_info.value.status_code == 404

    def test_search_character_not_found_raises_character_not_found(self, mock_deps):
        use_case, uow = mock_deps
        vg = Videogame(videogame_id=1, name="LoL", icon_url="/lol.png", rank_per_role=True)
        uow.videogame_repo.get_videogame_by_id.return_value = vg
        uow.character_repo.get_character_by_id.return_value = None

        filters = SearchVideogameProfilesRequest(videogame_id=1, characters=[999])

        with pytest.raises(CharacterNotFoundException) as exc_info:
            use_case.execute(filters=filters, player_id=1)

        assert exc_info.value.status_code == 404
