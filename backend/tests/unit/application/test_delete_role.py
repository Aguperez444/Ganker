from unittest.mock import MagicMock
import pytest

from app.application.use_cases.delete_role import DeleteRole
from app.application.ports.i_storage_service import IStorageService
from app.domain.models.videogame import Videogame
from app.domain.models.role import Role
from app.domain.exceptions.role.role_not_found_exception import RoleNotFoundException


class TestDeleteRoleUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.role_repo = MagicMock()
        uow.role_profile_repo = MagicMock()
        uow.game_profile_repo = MagicMock()

        storage_service = MagicMock(spec=IStorageService)
        storage_service.delete_file = MagicMock(return_value=True)

        use_case = DeleteRole(storage_service=storage_service, uow=uow)
        return use_case, uow, storage_service

    def test_delete_role_happy_path_no_active_dependencies(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/lol.png", rank_per_role=True)
        role = Role(role_id=10, name="Mid", videogame=vg, icon_url="/media/mid.png")

        uow.role_repo.get_role_by_id.return_value = role
        uow.role_profile_repo.count_associated_to_role.return_value = 0

        res = use_case.execute(role_id=10)

        assert "exitosamente" in res.message.lower()
        uow.role_profile_repo.delete_by_role_id.assert_not_called()
        uow.game_profile_repo.delete_game_profile.assert_not_called()
        uow.role_repo.delete_role.assert_called_once_with(10)
        storage_service.delete_file.assert_called_once_with("/media/mid.png")

    def test_delete_role_with_associated_profiles_deletes_empty_game_profile(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/lol.png", rank_per_role=True)
        role = Role(role_id=10, name="Mid", videogame=vg, icon_url="/media/mid.png")

        uow.role_repo.get_role_by_id.return_value = role
        uow.role_profile_repo.count_associated_to_role.return_value = 1
        uow.role_profile_repo.delete_by_role_id.return_value = [100]
        uow.role_profile_repo.count_by_game_profile_id.return_value = 0

        res = use_case.execute(role_id=10)

        assert "exitosamente" in res.message.lower()
        uow.role_profile_repo.delete_by_role_id.assert_called_once_with(10)
        uow.role_profile_repo.count_by_game_profile_id.assert_called_once_with(100)
        uow.game_profile_repo.delete_game_profile.assert_called_once_with(100)
        uow.role_repo.delete_role.assert_called_once_with(10)
        storage_service.delete_file.assert_called_once_with("/media/mid.png")

    def test_delete_role_with_associated_profiles_keeps_game_profile_when_not_empty(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/lol.png", rank_per_role=True)
        role = Role(role_id=10, name="Mid", videogame=vg, icon_url="/media/mid.png")

        uow.role_repo.get_role_by_id.return_value = role
        uow.role_profile_repo.count_associated_to_role.return_value = 1
        uow.role_profile_repo.delete_by_role_id.return_value = [100]
        uow.role_profile_repo.count_by_game_profile_id.return_value = 2

        res = use_case.execute(role_id=10)

        assert "exitosamente" in res.message.lower()
        uow.role_profile_repo.delete_by_role_id.assert_called_once_with(10)
        uow.role_profile_repo.count_by_game_profile_id.assert_called_once_with(100)
        uow.game_profile_repo.delete_game_profile.assert_not_called()
        uow.role_repo.delete_role.assert_called_once_with(10)
        storage_service.delete_file.assert_called_once_with("/media/mid.png")

    def test_delete_role_multiple_profiles_mixed(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/lol.png", rank_per_role=True)
        role = Role(role_id=10, name="Mid", videogame=vg, icon_url="/media/mid.png")

        uow.role_repo.get_role_by_id.return_value = role
        uow.role_profile_repo.count_associated_to_role.return_value = 2
        uow.role_profile_repo.delete_by_role_id.return_value = [100, 200]
        uow.role_profile_repo.count_by_game_profile_id.side_effect = lambda pid: 0 if pid == 100 else 1

        res = use_case.execute(role_id=10)

        assert "exitosamente" in res.message.lower()
        uow.role_profile_repo.delete_by_role_id.assert_called_once_with(10)
        uow.game_profile_repo.delete_game_profile.assert_called_once_with(100)
        uow.role_repo.delete_role.assert_called_once_with(10)

    def test_delete_role_not_found_raises_exception(self, mock_deps):
        use_case, uow, _ = mock_deps
        uow.role_repo.get_role_by_id.return_value = None

        with pytest.raises(RoleNotFoundException) as exc_info:
            use_case.execute(role_id=999)

        assert exc_info.value.status_code == 404

    def test_delete_role_without_icon_url_does_not_call_delete_file(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/lol.png", rank_per_role=True)
        role = Role(role_id=10, name="Mid", videogame=vg, icon_url="")

        uow.role_repo.get_role_by_id.return_value = role
        uow.role_profile_repo.count_associated_to_role.return_value = 0

        res = use_case.execute(role_id=10)

        assert "exitosamente" in res.message.lower()
        storage_service.delete_file.assert_not_called()
