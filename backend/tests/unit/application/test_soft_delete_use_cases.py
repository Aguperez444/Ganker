from unittest.mock import MagicMock
import pytest

from app.application.use_cases.delete_user import DeleteUserUseCase
from app.application.use_cases.delete_videogame import DeleteVideogameUseCase
from app.application.use_cases.delete_game_profile import DeleteGameProfileUseCase
from app.application.use_cases.soft_delete_role import SoftDeleteRoleUseCase
from app.application.use_cases.soft_delete_rank import SoftDeleteRankUseCase
from app.application.use_cases.soft_delete_character import SoftDeleteCharacterUseCase
from app.domain.exceptions.character.character_not_found_exception import CharacterNotFoundException
from app.domain.exceptions.domain_exception import DomainException
from app.domain.exceptions.game_profile.does_not_belong_to_profile_exception import DoesNotBelongToProfileException
from app.domain.exceptions.game_profile.game_profile_not_found_exception import GameProfileNotFoundException
from app.domain.exceptions.rank.cannot_delete_rank_exception import CannotDeleteRankException
from app.domain.exceptions.rank.rank_not_found_exception import RankNotFoundException
from app.domain.exceptions.role.role_not_found_exception import RoleNotFoundException
from app.domain.exceptions.user.user_not_found_exception import UserNotFoundException
from app.domain.exceptions.videogame.videogame_not_found_exception import VideogameNotFoundException
from app.domain.models.character import Character
from app.domain.models.game_profile import GameProfile
from app.domain.models.rank import Rank
from app.domain.models.role import Role
from app.domain.models.user import User
from app.domain.models.user_role import UserRole
from app.domain.models.videogame import Videogame


@pytest.fixture
def mock_uow():
    uow = MagicMock()
    uow.__enter__.return_value = uow
    uow.__exit__.return_value = None
    uow.user_repo = MagicMock()
    uow.videogame_repo = MagicMock()
    uow.game_profile_repo = MagicMock()
    uow.role_repo = MagicMock()
    uow.rank_repo = MagicMock()
    uow.character_repo = MagicMock()
    uow.region_repo = MagicMock()
    uow.role_profile_repo = MagicMock()
    uow.character_priority_repo = MagicMock()
    uow.refresh_token_repo = MagicMock()
    uow.reset_token_repo = MagicMock()
    uow.discord_account_link_repo = MagicMock()
    return uow


class TestDeleteUserUseCase:
    def test_delete_own_user_cascades_and_revokes_sessions(self, mock_uow):
        user = User(1, "jdoe", "John Doe", "jdoe@example.com", "hash", UserRole.PLAYER, [])
        mock_uow.user_repo.get_user_by_id.return_value = user
        mock_uow.game_profile_repo.soft_delete_by_player_id.return_value = [10, 20]

        use_case = DeleteUserUseCase(mock_uow)
        res = use_case.execute(target_user_id=1, requester_id=1, requester_role=UserRole.PLAYER)

        assert "exitosamente" in res.message.lower()
        mock_uow.game_profile_repo.soft_delete_by_player_id.assert_called_once_with(1)
        mock_uow.role_profile_repo.soft_delete_by_game_profile_ids.assert_called_once_with([10, 20])
        mock_uow.character_priority_repo.soft_delete_by_game_profile_ids.assert_called_once_with([10, 20])
        mock_uow.refresh_token_repo.revoke_all_by_user_id.assert_called_once_with(1)
        mock_uow.reset_token_repo.invalidate_all_user_tokens.assert_called_once_with(1)
        mock_uow.discord_account_link_repo.delete_by_user_id.assert_called_once_with(1)
        mock_uow.user_repo.soft_delete_user.assert_called_once_with(1)

    def test_delete_user_not_found_raises_404(self, mock_uow):
        mock_uow.user_repo.get_user_by_id.return_value = None
        use_case = DeleteUserUseCase(mock_uow)

        with pytest.raises(UserNotFoundException) as exc:
            use_case.execute(target_user_id=999)
        assert exc.value.status_code == 404

    def test_player_cannot_delete_another_user_raises_403(self, mock_uow):
        target = User(2, "other", "Other", "other@example.com", "hash", UserRole.PLAYER, [])
        mock_uow.user_repo.get_user_by_id.return_value = target

        use_case = DeleteUserUseCase(mock_uow)
        with pytest.raises(DomainException) as exc:
            use_case.execute(target_user_id=2, requester_id=1, requester_role=UserRole.PLAYER)
        assert exc.value.status_code == 403

    def test_admin_cannot_delete_owner_raises_403(self, mock_uow):
        owner = User(3, "owner", "Owner", "owner@example.com", "hash", UserRole.OWNER, [])
        mock_uow.user_repo.get_user_by_id.return_value = owner

        use_case = DeleteUserUseCase(mock_uow)
        with pytest.raises(DomainException) as exc:
            use_case.execute(target_user_id=3, requester_id=2, requester_role=UserRole.ADMIN)
        assert exc.value.status_code == 403

    def test_admin_can_delete_player(self, mock_uow):
        player = User(1, "jdoe", "John Doe", "jdoe@example.com", "hash", UserRole.PLAYER, [])
        mock_uow.user_repo.get_user_by_id.return_value = player
        mock_uow.game_profile_repo.soft_delete_by_player_id.return_value = []

        use_case = DeleteUserUseCase(mock_uow)
        res = use_case.execute(target_user_id=1, requester_id=2, requester_role=UserRole.ADMIN)

        assert "exitosamente" in res.message.lower()
        mock_uow.user_repo.soft_delete_user.assert_called_once_with(1)


class TestDeleteVideogameUseCase:
    def test_delete_videogame_cascades_all_dependents(self, mock_uow):
        vg = Videogame(videogame_id=5, name="Valorant", icon_url="/val.png", rank_per_role=False)
        mock_uow.videogame_repo.get_videogame_by_id.return_value = vg
        mock_uow.game_profile_repo.soft_delete_by_videogame_id.return_value = [101, 102]

        use_case = DeleteVideogameUseCase(mock_uow)
        res = use_case.execute(videogame_id=5)

        assert "exitosamente" in res.message.lower()
        mock_uow.game_profile_repo.soft_delete_by_videogame_id.assert_called_once_with(5)
        mock_uow.role_profile_repo.soft_delete_by_game_profile_ids.assert_called_once_with([101, 102])
        mock_uow.character_priority_repo.soft_delete_by_game_profile_ids.assert_called_once_with([101, 102])
        mock_uow.role_repo.soft_delete_by_videogame_id.assert_called_once_with(5)
        mock_uow.rank_repo.soft_delete_by_videogame_id.assert_called_once_with(5)
        mock_uow.character_repo.soft_delete_by_videogame_id.assert_called_once_with(5)
        mock_uow.region_repo.soft_delete_by_videogame_id.assert_called_once_with(5)
        mock_uow.videogame_repo.soft_delete_videogame.assert_called_once_with(5)

    def test_delete_videogame_not_found_raises_404(self, mock_uow):
        mock_uow.videogame_repo.get_videogame_by_id.return_value = None
        use_case = DeleteVideogameUseCase(mock_uow)

        with pytest.raises(VideogameNotFoundException) as exc:
            use_case.execute(videogame_id=999)
        assert exc.value.status_code == 404


class TestDeleteGameProfileUseCase:
    def test_delete_game_profile_cascades_role_profiles_and_priorities(self, mock_uow):
        vg = Videogame(videogame_id=1, name="LoL", icon_url="/lol.png", rank_per_role=True)
        gp = GameProfile(
            game_profile_id=50,
            player_id=1,
            videogame=vg,
            characters_priority=[],
            role_profiles=[],
            region=None,
        )
        mock_uow.game_profile_repo.get_game_profile_by_id.return_value = gp

        use_case = DeleteGameProfileUseCase(mock_uow)
        res = use_case.execute(game_profile_id=50, player_id=1, requester_role=UserRole.PLAYER)

        assert "exitosamente" in res.message.lower()
        mock_uow.role_profile_repo.soft_delete_by_game_profile_id.assert_called_once_with(50)
        mock_uow.character_priority_repo.soft_delete_by_game_profile_id.assert_called_once_with(50)
        mock_uow.game_profile_repo.soft_delete_game_profile.assert_called_once_with(50)

    def test_delete_game_profile_not_found_raises_404(self, mock_uow):
        mock_uow.game_profile_repo.get_game_profile_by_id.return_value = None
        use_case = DeleteGameProfileUseCase(mock_uow)

        with pytest.raises(GameProfileNotFoundException) as exc:
            use_case.execute(game_profile_id=999, player_id=1)
        assert exc.value.status_code == 404

    def test_delete_game_profile_belonging_to_other_player_raises_403(self, mock_uow):
        vg = Videogame(videogame_id=1, name="LoL", icon_url="/lol.png", rank_per_role=True)
        gp = GameProfile(
            game_profile_id=50,
            player_id=2,
            videogame=vg,
            characters_priority=[],
            role_profiles=[],
            region=None,
        )
        mock_uow.game_profile_repo.get_game_profile_by_id.return_value = gp

        use_case = DeleteGameProfileUseCase(mock_uow)
        with pytest.raises(DoesNotBelongToProfileException) as exc:
            use_case.execute(game_profile_id=50, player_id=1, requester_role=UserRole.PLAYER)
        assert exc.value.status_code in (400, 403)


class TestSoftDeleteDependentUseCases:
    def test_soft_delete_role_cascades_empty_game_profiles(self, mock_uow):
        vg = Videogame(videogame_id=1, name="LoL", icon_url="/lol.png", rank_per_role=True)
        role = Role(role_id=10, name="Mid", videogame=vg, icon_url="/mid.png")
        mock_uow.role_repo.get_role_by_id.return_value = role
        mock_uow.role_profile_repo.count_associated_to_role.return_value = 1
        mock_uow.role_profile_repo.soft_delete_by_role_id.return_value = [100]
        mock_uow.role_profile_repo.count_by_game_profile_id.return_value = 0

        res = SoftDeleteRoleUseCase(mock_uow).execute(role_id=10)
        assert "exitosamente" in res.message.lower()
        mock_uow.role_profile_repo.soft_delete_by_role_id.assert_called_once_with(10)
        mock_uow.character_priority_repo.soft_delete_by_game_profile_id.assert_called_once_with(100)
        mock_uow.game_profile_repo.soft_delete_game_profile.assert_called_once_with(100)
        mock_uow.role_repo.soft_delete_role.assert_called_once_with(10)

    def test_soft_delete_role_not_found_raises_404(self, mock_uow):
        mock_uow.role_repo.get_role_by_id.return_value = None
        with pytest.raises(RoleNotFoundException):
            SoftDeleteRoleUseCase(mock_uow).execute(role_id=999)

    def test_soft_delete_rank_reassigns_and_soft_deletes(self, mock_uow):
        vg = Videogame(videogame_id=1, name="LoL", icon_url="/lol.png", rank_per_role=True)
        r1 = Rank(rank_id=1, name="Gold", value=100, videogame=vg, icon_url="/g.png")
        r2 = Rank(rank_id=2, name="Plat", value=200, videogame=vg, icon_url="/p.png")
        mock_uow.rank_repo.get_rank_by_id.return_value = r2
        mock_uow.role_profile_repo.count_associated_to_rank.return_value = 2
        mock_uow.rank_repo.get_ranks_by_game_id.return_value = [r1, r2]

        res = SoftDeleteRankUseCase(mock_uow).execute(rank_id=2)
        assert "exitosamente" in res.message.lower()
        mock_uow.role_profile_repo.reassign_associated_to_rank.assert_called_once_with(
            source_rank_id=2, target_rank_id=1
        )
        mock_uow.rank_repo.soft_delete_rank.assert_called_once_with(2)

    def test_soft_delete_rank_only_rank_raises_cannot_delete(self, mock_uow):
        vg = Videogame(videogame_id=1, name="LoL", icon_url="/lol.png", rank_per_role=True)
        r1 = Rank(rank_id=1, name="Gold", value=100, videogame=vg, icon_url="/g.png")
        mock_uow.rank_repo.get_rank_by_id.return_value = r1
        mock_uow.role_profile_repo.count_associated_to_rank.return_value = 1
        mock_uow.rank_repo.get_ranks_by_game_id.return_value = [r1]

        with pytest.raises(CannotDeleteRankException):
            SoftDeleteRankUseCase(mock_uow).execute(rank_id=1)

    def test_soft_delete_rank_not_found_raises_404(self, mock_uow):
        mock_uow.rank_repo.get_rank_by_id.return_value = None
        with pytest.raises(RankNotFoundException):
            SoftDeleteRankUseCase(mock_uow).execute(rank_id=999)

    def test_soft_delete_character_readjusts_and_soft_deletes(self, mock_uow):
        vg = Videogame(videogame_id=1, name="LoL", icon_url="/lol.png", rank_per_role=True)
        ch = Character(character_id=10, name="Ahri", videogame=vg, icon_url="/ahri.png")
        mock_uow.character_repo.get_character_by_id.return_value = ch
        mock_uow.character_priority_repo.count_associated_to_character.return_value = 1

        res = SoftDeleteCharacterUseCase(mock_uow).execute(character_id=10)
        assert "exitosamente" in res.message.lower()
        mock_uow.character_priority_repo.soft_delete_and_readjust_for_character.assert_called_once_with(10)
        mock_uow.character_repo.soft_delete_character.assert_called_once_with(10)

    def test_soft_delete_character_not_found_raises_404(self, mock_uow):
        mock_uow.character_repo.get_character_by_id.return_value = None
        with pytest.raises(CharacterNotFoundException):
            SoftDeleteCharacterUseCase(mock_uow).execute(character_id=999)
