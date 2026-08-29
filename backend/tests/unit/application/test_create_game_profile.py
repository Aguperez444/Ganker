import pytest
from unittest.mock import MagicMock

from app.application.useCases.create_videogame_profile import CreateVideogameProfile
from app.domain.models.videogame import Videogame
from app.domain.models.character import Character
from app.domain.models.role import Role
from app.domain.models.rank import Rank
from app.domain.models.game_profile import GameProfile
from app.domain.exceptions.videogame_not_found_exception import VideogameNotFoundException
from app.domain.exceptions.game_profile_already_exist_exception import GameProfileAlreadyExistException
from app.domain.exceptions.character_not_found_exception import CharacterNotFoundException
from app.domain.exceptions.role_not_found_exception import RoleNotFoundException
from app.domain.exceptions.rank_not_found_exception import RankNotFoundException
from app.infrastructure.api.dto.create_videogame_profile_request import CreateGameProfileRequest, RoleRankInput


class TestCreateVideogameProfileUseCase:

    @pytest.fixture
    def mock_uow(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.videogame_repo = MagicMock()
        uow.character_repo = MagicMock()
        uow.role_repo = MagicMock()
        uow.rank_repo = MagicMock()
        uow.game_profile_repo = MagicMock()
        return uow

    def test_create_game_profile_happy_path(self, mock_uow):
        use_case = CreateVideogameProfile(unit_of_work=mock_uow)

        vg = Videogame(1, "LoL")
        char1 = Character(10, "Ahri", vg)
        char2 = Character(11, "Yasuo", vg)
        role1 = Role(100, "Mid", vg)
        rank1 = Rank(1000, "Diamond", 3000, vg)

        # Mockea las validaciones para asegurarse de que los falsos repos devuelvan lo que deberían devolver en el camino feliz
        mock_uow.videogame_repo.get_videogame_by_id.return_value = vg
        mock_uow.game_profile_repo.get_game_profile_by_player_and_videogame.return_value = None
        mock_uow.character_repo.get_character_by_id.side_effect = lambda cid: char1 if cid == 10 else char2
        mock_uow.role_repo.get_role_by_id.return_value = role1
        mock_uow.rank_repo.get_rank_by_id.return_value = rank1

        created_profile = GameProfile(
            game_profile_id=1,
            player_id=5,
            videogame=vg,
            characters=[char1, char2],
            role_profiles=[]
        )
        mock_uow.game_profile_repo.create_game_profile.return_value = created_profile

        # mockea una request
        request = CreateGameProfileRequest(
            videogame_id=1,
            character_ids=[10, 11],
            roles=[RoleRankInput(role_id=100, rank_id=1000)]
        )

        result = use_case.execute(player_id=5, create_videogame_profile_request=request)

        # revisa que se haya llamado a los métodos correctos y que el resultado sea el esperado
        assert result.game_profile_id == 1
        assert result.player_id == 5
        mock_uow.game_profile_repo.create_game_profile.assert_called_once()

    def test_create_game_profile_videogame_not_found(self, mock_uow):
        use_case = CreateVideogameProfile(unit_of_work=mock_uow)
        mock_uow.videogame_repo.get_videogame_by_id.return_value = None

        request = CreateGameProfileRequest(
            videogame_id=999,
            character_ids=[1],
            roles=[RoleRankInput(role_id=1, rank_id=1)]
        )

        with pytest.raises(VideogameNotFoundException) as exc_info:
            use_case.execute(player_id=1, create_videogame_profile_request=request)

        assert "999" in exc_info.value.message
        assert exc_info.value.status_code == 404

    def test_create_game_profile_already_exists(self, mock_uow):
        use_case = CreateVideogameProfile(unit_of_work=mock_uow)

        vg = Videogame(1, "LoL")
        mock_uow.videogame_repo.get_videogame_by_id.return_value = vg
        existing_profile = GameProfile(1, 5, vg, [], [])
        mock_uow.game_profile_repo.get_game_profile_by_player_and_videogame.return_value = existing_profile

        request = CreateGameProfileRequest(
            videogame_id=1,
            character_ids=[1],
            roles=[RoleRankInput(role_id=1, rank_id=1)]
        )

        with pytest.raises(GameProfileAlreadyExistException) as exc_info:
            use_case.execute(player_id=5, create_videogame_profile_request=request)

        assert exc_info.value.status_code == 400

    def test_create_game_profile_character_not_found(self, mock_uow):
        use_case = CreateVideogameProfile(unit_of_work=mock_uow)

        vg = Videogame(1, "LoL")
        mock_uow.videogame_repo.get_videogame_by_id.return_value = vg
        mock_uow.game_profile_repo.get_game_profile_by_player_and_videogame.return_value = None
        mock_uow.character_repo.get_character_by_id.return_value = None

        request = CreateGameProfileRequest(
            videogame_id=1,
            character_ids=[999],
            roles=[RoleRankInput(role_id=1, rank_id=1)]
        )

        with pytest.raises(CharacterNotFoundException) as exc_info:
            use_case.execute(player_id=1, create_videogame_profile_request=request)

        assert "999" in exc_info.value.message
        assert exc_info.value.status_code == 404

    def test_create_game_profile_role_not_found(self, mock_uow):
        use_case = CreateVideogameProfile(unit_of_work=mock_uow)

        vg = Videogame(1, "LoL")
        char = Character(1, "Ahri", vg)
        mock_uow.videogame_repo.get_videogame_by_id.return_value = vg
        mock_uow.game_profile_repo.get_game_profile_by_player_and_videogame.return_value = None
        mock_uow.character_repo.get_character_by_id.return_value = char
        mock_uow.role_repo.get_role_by_id.return_value = None

        request = CreateGameProfileRequest(
            videogame_id=1,
            character_ids=[1],
            roles=[RoleRankInput(role_id=888, rank_id=1)]
        )

        with pytest.raises(RoleNotFoundException) as exc_info:
            use_case.execute(player_id=1, create_videogame_profile_request=request)

        assert "888" in exc_info.value.message
        assert exc_info.value.status_code == 404

    def test_create_game_profile_rank_not_found(self, mock_uow):
        use_case = CreateVideogameProfile(unit_of_work=mock_uow)

        vg = Videogame(1, "LoL")
        char = Character(1, "Ahri", vg)
        role = Role(1, "Mid", vg)
        mock_uow.videogame_repo.get_videogame_by_id.return_value = vg
        mock_uow.game_profile_repo.get_game_profile_by_player_and_videogame.return_value = None
        mock_uow.character_repo.get_character_by_id.return_value = char
        mock_uow.role_repo.get_role_by_id.return_value = role
        mock_uow.rank_repo.get_rank_by_id.return_value = None

        request = CreateGameProfileRequest(
            videogame_id=1,
            character_ids=[1],
            roles=[RoleRankInput(role_id=1, rank_id=777)]
        )

        with pytest.raises(RankNotFoundException) as exc_info:
            use_case.execute(player_id=1, create_videogame_profile_request=request)

        assert "777" in exc_info.value.message
        assert exc_info.value.status_code == 404
