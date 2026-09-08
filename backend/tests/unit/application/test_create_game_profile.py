import pytest
from unittest.mock import MagicMock

from app.application.use_cases.create_videogame_profile import CreateVideogameProfile
from app.domain.models.videogame import Videogame
from app.domain.models.character import Character
from app.domain.models.role import Role
from app.domain.models.rank import Rank
from app.domain.models.game_profile import GameProfile
from app.domain.models.character_priority import CharacterPriority
from app.domain.models.role_profile import RoleProfile
from app.domain.exceptions.videogame.videogame_not_found_exception import VideogameNotFoundException
from app.domain.exceptions.game_profile.game_profile_already_exist_exception import GameProfileAlreadyExistException
from app.domain.exceptions.character.character_not_found_exception import CharacterNotFoundException
from app.domain.exceptions.role.role_not_found_exception import RoleNotFoundException
from app.domain.exceptions.rank.rank_not_found_exception import RankNotFoundException
from app.domain.exceptions.does_not_belong_to_game_exception import DoesNotBelongToGameException
from app.infrastructure.api.dto.response.create_videogame_profile_request import CreateGameProfileRequest, RoleRankInput


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

        vg = Videogame(1, "LoL", "/icon.png", rank_per_role=True)
        char1 = Character(10, "Ahri", vg, "/ahri.png")
        char2 = Character(11, "Yasuo", vg, "/yasuo.png")
        role1 = Role(100, "Mid", vg, "/mid.png")
        rank1 = Rank(1000, "Diamond", 3000, vg, "/diamond.png")

        mock_uow.videogame_repo.get_videogame_by_id.return_value = vg
        mock_uow.game_profile_repo.get_game_profile_by_player_and_videogame.return_value = None
        mock_uow.character_repo.get_character_by_id.side_effect = lambda cid: char1 if cid == 10 else char2
        mock_uow.role_repo.get_role_by_id.return_value = role1
        mock_uow.rank_repo.get_rank_by_id.return_value = rank1

        created_profile = GameProfile(
            game_profile_id=1,
            player_id=5,
            videogame=vg,
            characters_priority=[
                CharacterPriority(1, char1, 1),
                CharacterPriority(2, char2, 2)
            ],
            role_profiles=[RoleProfile(1, role1, rank1)]
        )
        mock_uow.game_profile_repo.create_game_profile.return_value = created_profile

        request = CreateGameProfileRequest(
            videogame_id=1,
            character_ids=[10, 11],
            roles=[RoleRankInput(role_id=100, rank_id=1000)]
        )

        result = use_case.execute(player_id=5, create_videogame_profile_request=request)

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

        vg = Videogame(1, "LoL", "/icon.png", rank_per_role=True)
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

        vg = Videogame(1, "LoL", "/icon.png", rank_per_role=True)
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

    def test_create_game_profile_character_does_not_belong_to_game(self, mock_uow):
        use_case = CreateVideogameProfile(unit_of_work=mock_uow)

        vg_lol = Videogame(1, "LoL", "/icon.png", rank_per_role=True)
        vg_dota = Videogame(2, "Dota 2", "/icon2.png", rank_per_role=False)
        char_dota = Character(10, "Pudge", vg_dota, "/pudge.png")

        mock_uow.videogame_repo.get_videogame_by_id.return_value = vg_lol
        mock_uow.game_profile_repo.get_game_profile_by_player_and_videogame.return_value = None
        mock_uow.character_repo.get_character_by_id.return_value = char_dota

        request = CreateGameProfileRequest(
            videogame_id=1,
            character_ids=[10],
            roles=[RoleRankInput(role_id=1, rank_id=1)]
        )

        with pytest.raises(DoesNotBelongToGameException) as exc_info:
            use_case.execute(player_id=1, create_videogame_profile_request=request)

        assert exc_info.value.status_code == 400
        assert "Pudge" in exc_info.value.message

    def test_create_game_profile_role_not_found(self, mock_uow):
        use_case = CreateVideogameProfile(unit_of_work=mock_uow)

        vg = Videogame(1, "LoL", "/icon.png", rank_per_role=True)
        char = Character(1, "Ahri", vg, "/ahri.png")
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

    def test_create_game_profile_role_does_not_belong_to_game(self, mock_uow):
        use_case = CreateVideogameProfile(unit_of_work=mock_uow)

        vg_lol = Videogame(1, "LoL", "/icon.png", rank_per_role=True)
        vg_dota = Videogame(2, "Dota 2", "/icon2.png", rank_per_role=False)
        char = Character(1, "Ahri", vg_lol, "/ahri.png")
        role_dota = Role(1, "Offlane", vg_dota, "/offlane.png")
        rank = Rank(1, "Gold", 1000, vg_lol, "/gold.png")

        mock_uow.videogame_repo.get_videogame_by_id.return_value = vg_lol
        mock_uow.game_profile_repo.get_game_profile_by_player_and_videogame.return_value = None
        mock_uow.character_repo.get_character_by_id.return_value = char
        mock_uow.role_repo.get_role_by_id.return_value = role_dota
        mock_uow.rank_repo.get_rank_by_id.return_value = rank

        request = CreateGameProfileRequest(
            videogame_id=1,
            character_ids=[1],
            roles=[RoleRankInput(role_id=1, rank_id=1)]
        )

        with pytest.raises(DoesNotBelongToGameException) as exc_info:
            use_case.execute(player_id=1, create_videogame_profile_request=request)

        assert exc_info.value.status_code == 400
        assert "Offlane" in exc_info.value.message

    def test_create_game_profile_rank_not_found(self, mock_uow):
        use_case = CreateVideogameProfile(unit_of_work=mock_uow)

        vg = Videogame(1, "LoL", "/icon.png", rank_per_role=True)
        char = Character(1, "Ahri", vg, "/ahri.png")
        role = Role(1, "Mid", vg, "/mid.png")
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

    def test_create_game_profile_rank_does_not_belong_to_game(self, mock_uow):
        use_case = CreateVideogameProfile(unit_of_work=mock_uow)

        vg_lol = Videogame(1, "LoL", "/icon.png", rank_per_role=True)
        vg_dota = Videogame(2, "Dota 2", "/icon2.png", rank_per_role=False)
        char = Character(1, "Ahri", vg_lol, "/ahri.png")
        role = Role(1, "Mid", vg_lol, "/mid.png")
        rank_dota = Rank(1, "Herald", 100, vg_dota, "/herald.png")

        mock_uow.videogame_repo.get_videogame_by_id.return_value = vg_lol
        mock_uow.game_profile_repo.get_game_profile_by_player_and_videogame.return_value = None
        mock_uow.character_repo.get_character_by_id.return_value = char
        mock_uow.role_repo.get_role_by_id.return_value = role
        mock_uow.rank_repo.get_rank_by_id.return_value = rank_dota

        request = CreateGameProfileRequest(
            videogame_id=1,
            character_ids=[1],
            roles=[RoleRankInput(role_id=1, rank_id=1)]
        )

        with pytest.raises(DoesNotBelongToGameException) as exc_info:
            use_case.execute(player_id=1, create_videogame_profile_request=request)

        assert exc_info.value.status_code == 400
        assert "Herald" in exc_info.value.message
