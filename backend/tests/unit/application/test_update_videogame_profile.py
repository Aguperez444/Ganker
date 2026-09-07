import pytest
from unittest.mock import MagicMock

from app.application.useCases.update_videogame_profile import UpdateVideogameProfile
from app.domain.models.videogame import Videogame
from app.domain.models.character import Character
from app.domain.models.role import Role
from app.domain.models.rank import Rank
from app.domain.models.game_profile import GameProfile
from app.domain.exceptions.game_profile.game_profile_not_found_exception import GameProfileNotFoundException
from app.domain.exceptions.game_profile.does_not_belong_to_profile_exception import DoesNotBelongToProfileException
from app.domain.exceptions.character.character_not_found_exception import CharacterNotFoundException
from app.domain.exceptions.role.role_not_found_exception import RoleNotFoundException
from app.domain.exceptions.rank.rank_not_found_exception import RankNotFoundException
from app.domain.exceptions.does_not_belong_to_game_exception import DoesNotBelongToGameException
from app.infrastructure.api.dto.request.update_videogame_profile_request import UpdateGameProfileRequest, RoleRankInput


class TestUpdateVideogameProfileUseCase:

    @pytest.fixture
    def mock_uow(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.game_profile_repo = MagicMock()
        uow.character_repo = MagicMock()
        uow.role_repo = MagicMock()
        uow.rank_repo = MagicMock()
        return uow

    def test_update_videogame_profile_happy_path(self, mock_uow):
        use_case = UpdateVideogameProfile(unit_of_work=mock_uow)

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png")
        char1 = Character(10, "Ahri", vg, "/ahri.png")
        role1 = Role(100, "Mid", vg, "/mid.png")
        rank1 = Rank(1000, "Diamond", 3000, vg, "/diamond.png")

        existing_profile = GameProfile(
            game_profile_id=5,
            player_id=42,
            videogame=vg,
            characters_priority=[],
            role_profiles=[]
        )
        mock_uow.game_profile_repo.get_game_profile_by_id.return_value = existing_profile
        mock_uow.character_repo.get_character_by_id.return_value = char1
        mock_uow.role_repo.get_role_by_id.return_value = role1
        mock_uow.rank_repo.get_rank_by_id.return_value = rank1
        def fake_update(gp):
            for i, rp in enumerate(gp.role_profiles, start=1):
                rp.role_profile_id = i
            return gp
        mock_uow.game_profile_repo.update_game_profile.side_effect = fake_update

        req = UpdateGameProfileRequest(
            character_ids=[10],
            roles_ranks=[RoleRankInput(role_id=100, rank_id=1000)]
        )

        result = use_case.execute(player_id=42, game_profile_id=5, update_videogame_profile_request=req)

        assert result.game_profile_id == 5
        assert result.player_id == 42
        assert len(result.characters) == 1
        assert result.characters[0].character_id == 10
        assert len(result.role_profiles) == 1
        assert result.role_profiles[0].role.role_id == 100
        assert result.role_profiles[0].rank.rank_id == 1000

        mock_uow.game_profile_repo.update_game_profile.assert_called_once()

    def test_update_videogame_profile_not_found(self, mock_uow):
        use_case = UpdateVideogameProfile(unit_of_work=mock_uow)
        mock_uow.game_profile_repo.get_game_profile_by_id.return_value = None

        req = UpdateGameProfileRequest(character_ids=[], roles_ranks=[])

        with pytest.raises(GameProfileNotFoundException) as exc_info:
            use_case.execute(player_id=42, game_profile_id=999, update_videogame_profile_request=req)

        assert exc_info.value.status_code == 404

    def test_update_videogame_profile_does_not_belong_to_player(self, mock_uow):
        use_case = UpdateVideogameProfile(unit_of_work=mock_uow)

        vg = Videogame(1, "LoL", "/icon.png")
        existing_profile = GameProfile(5, player_id=99, videogame=vg, characters_priority=[], role_profiles=[])
        mock_uow.game_profile_repo.get_game_profile_by_id.return_value = existing_profile

        req = UpdateGameProfileRequest(character_ids=[], roles_ranks=[])

        with pytest.raises(DoesNotBelongToProfileException) as exc_info:
            use_case.execute(player_id=42, game_profile_id=5, update_videogame_profile_request=req)

        assert exc_info.value.status_code == 400

    def test_update_videogame_profile_character_not_found(self, mock_uow):
        use_case = UpdateVideogameProfile(unit_of_work=mock_uow)

        vg = Videogame(1, "LoL", "/icon.png")
        existing_profile = GameProfile(5, player_id=42, videogame=vg, characters_priority=[], role_profiles=[])
        mock_uow.game_profile_repo.get_game_profile_by_id.return_value = existing_profile
        mock_uow.character_repo.get_character_by_id.return_value = None

        req = UpdateGameProfileRequest(character_ids=[999], roles_ranks=[])

        with pytest.raises(CharacterNotFoundException) as exc_info:
            use_case.execute(player_id=42, game_profile_id=5, update_videogame_profile_request=req)

        assert exc_info.value.status_code == 404

    def test_update_videogame_profile_character_not_belonging_to_game(self, mock_uow):
        use_case = UpdateVideogameProfile(unit_of_work=mock_uow)

        vg_lol = Videogame(1, "LoL", "/icon.png")
        vg_dota = Videogame(2, "Dota 2", "/icon.png")
        existing_profile = GameProfile(5, player_id=42, videogame=vg_lol, characters_priority=[], role_profiles=[])
        dota_char = Character(10, "Pudge", vg_dota, "/pudge.png")

        mock_uow.game_profile_repo.get_game_profile_by_id.return_value = existing_profile
        mock_uow.character_repo.get_character_by_id.return_value = dota_char

        req = UpdateGameProfileRequest(character_ids=[10], roles_ranks=[])

        with pytest.raises(DoesNotBelongToGameException) as exc_info:
            use_case.execute(player_id=42, game_profile_id=5, update_videogame_profile_request=req)

        assert exc_info.value.status_code == 400

    def test_update_videogame_profile_role_not_found(self, mock_uow):
        use_case = UpdateVideogameProfile(unit_of_work=mock_uow)

        vg = Videogame(1, "LoL", "/icon.png")
        existing_profile = GameProfile(5, player_id=42, videogame=vg, characters_priority=[], role_profiles=[])
        mock_uow.game_profile_repo.get_game_profile_by_id.return_value = existing_profile
        mock_uow.role_repo.get_role_by_id.return_value = None

        req = UpdateGameProfileRequest(character_ids=[], roles_ranks=[RoleRankInput(role_id=999, rank_id=1)])

        with pytest.raises(RoleNotFoundException) as exc_info:
            use_case.execute(player_id=42, game_profile_id=5, update_videogame_profile_request=req)

        assert exc_info.value.status_code == 404

    def test_update_videogame_profile_rank_not_found(self, mock_uow):
        use_case = UpdateVideogameProfile(unit_of_work=mock_uow)

        vg = Videogame(1, "LoL", "/icon.png")
        role = Role(1, "Mid", vg, "/mid.png")
        existing_profile = GameProfile(5, player_id=42, videogame=vg, characters_priority=[], role_profiles=[])
        mock_uow.game_profile_repo.get_game_profile_by_id.return_value = existing_profile
        mock_uow.role_repo.get_role_by_id.return_value = role
        mock_uow.rank_repo.get_rank_by_id.return_value = None

        req = UpdateGameProfileRequest(character_ids=[], roles_ranks=[RoleRankInput(role_id=1, rank_id=999)])

        with pytest.raises(RankNotFoundException) as exc_info:
            use_case.execute(player_id=42, game_profile_id=5, update_videogame_profile_request=req)

        assert exc_info.value.status_code == 404

    def test_update_videogame_profile_role_or_rank_not_belonging_to_game(self, mock_uow):
        use_case = UpdateVideogameProfile(unit_of_work=mock_uow)

        vg_lol = Videogame(1, "LoL", "/icon.png")
        vg_dota = Videogame(2, "Dota 2", "/icon.png")
        role_dota = Role(1, "Offlane", vg_dota, "/offlane.png")
        rank_lol = Rank(1, "Gold", 1000, vg_lol, "/gold.png")

        existing_profile = GameProfile(5, player_id=42, videogame=vg_lol, characters_priority=[], role_profiles=[])
        mock_uow.game_profile_repo.get_game_profile_by_id.return_value = existing_profile
        mock_uow.role_repo.get_role_by_id.return_value = role_dota
        mock_uow.rank_repo.get_rank_by_id.return_value = rank_lol

        req = UpdateGameProfileRequest(character_ids=[], roles_ranks=[RoleRankInput(role_id=1, rank_id=1)])

        with pytest.raises(DoesNotBelongToGameException) as exc_info:
            use_case.execute(player_id=42, game_profile_id=5, update_videogame_profile_request=req)

        assert exc_info.value.status_code == 400
