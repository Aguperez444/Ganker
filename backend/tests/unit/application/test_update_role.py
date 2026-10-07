from unittest.mock import MagicMock
import pytest

from app.application.use_cases.update_role import UpdateRole
from app.application.ports.i_storage_service import IStorageService
from app.domain.models.videogame import Videogame
from app.domain.models.role import Role
from app.domain.exceptions.role.invalid_role_name_exception import InvalidRoleNameException
from app.domain.exceptions.role.duplicated_role_name_exception import DuplicateRoleNameException
from app.domain.exceptions.role.role_not_found_exception import RoleNotFoundException


class TestUpdateRoleUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.role_repo = MagicMock()
        uow.role_repo.get_role_by_name_and_videogame.return_value = None

        storage_service = MagicMock(spec=IStorageService)
        storage_service.save_image_file = MagicMock(return_value="/media/games/league_of_legends/roles/mid_new.png")
        storage_service.delete_file = MagicMock(return_value=True)

        use_case = UpdateRole(storage_service=storage_service, uow=uow)
        return use_case, uow, storage_service

    def test_update_role_happy_path_all_fields(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="League of Legends", icon_url="/icon.png", rank_per_role=True)
        existing = Role(role_id=1, name="Mid", videogame=vg, icon_url="/media/games/league_of_legends/roles/mid_old.png")
        uow.role_repo.get_role_by_id.return_value = existing
        uow.role_repo.get_roles_by_game_id.return_value = [existing]
        uow.role_repo.update_role.side_effect = lambda r: r

        mock_icon = MagicMock()
        mock_icon.filename = "mid_new.png"
        mock_icon.file = MagicMock()

        result = use_case.execute(role_id=1, name="Middle Lane", icon=mock_icon)

        assert result.role_id == 1
        assert result.name == "Middle Lane"
        assert result.icon_url == "/media/games/league_of_legends/roles/mid_new.png"

        storage_service.delete_file.assert_called_once_with("/media/games/league_of_legends/roles/mid_old.png")
        storage_service.save_image_file.assert_called_once()
        uow.role_repo.update_role.assert_called_once()

    def test_update_role_keep_same_name_change_only_icon(self, mock_deps):
        # Probar modificar un rol manteniendo su nombre actual y cambiando únicamente su ícono o descripción (pasa)
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="League of Legends", icon_url="/icon.png", rank_per_role=True)
        existing = Role(role_id=1, name="Mid", videogame=vg, icon_url="/media/games/league_of_legends/roles/mid_old.png")
        uow.role_repo.get_role_by_id.return_value = existing
        uow.role_repo.get_roles_by_game_id.return_value = [existing]
        uow.role_repo.update_role.side_effect = lambda r: r

        mock_icon = MagicMock()
        mock_icon.filename = "mid_new.png"
        mock_icon.file = MagicMock()

        result = use_case.execute(role_id=1, name="Mid", icon=mock_icon)

        assert result.role_id == 1
        assert result.name == "Mid"
        assert result.icon_url == "/media/games/league_of_legends/roles/mid_new.png"

        storage_service.delete_file.assert_called_once_with("/media/games/league_of_legends/roles/mid_old.png")
        storage_service.save_image_file.assert_called_once()
        uow.role_repo.update_role.assert_called_once()

    def test_update_role_change_name_without_icon(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="League of Legends", icon_url="/icon.png", rank_per_role=True)
        existing = Role(role_id=1, name="Mid", videogame=vg, icon_url="/media/games/league_of_legends/roles/mid.png")
        uow.role_repo.get_role_by_id.return_value = existing
        uow.role_repo.get_roles_by_game_id.return_value = [existing]
        uow.role_repo.update_role.side_effect = lambda r: r

        result = use_case.execute(role_id=1, name="Midlane", icon=None)

        assert result.role_id == 1
        assert result.name == "Midlane"
        assert result.icon_url == "/media/games/league_of_legends/roles/mid.png"

        storage_service.delete_file.assert_not_called()
        storage_service.save_image_file.assert_not_called()
        uow.role_repo.update_role.assert_called_once()

    def test_update_role_empty_name(self, mock_deps):
        # Probar modificar el nombre de un rol dejando el campo vacío (falla)
        use_case, _, _ = mock_deps

        with pytest.raises(InvalidRoleNameException) as exc_info:
            use_case.execute(role_id=1, name="   ", icon=None)

        assert exc_info.value.status_code == 400

    def test_update_role_not_found(self, mock_deps):
        use_case, uow, _ = mock_deps
        uow.role_repo.get_role_by_id.return_value = None

        with pytest.raises(RoleNotFoundException) as exc_info:
            use_case.execute(role_id=999, name="Jungler", icon=None)

        assert exc_info.value.status_code == 404

    def test_update_role_duplicate_name_same_game(self, mock_deps):
        # Probar modificar el nombre de un rol ingresando uno que ya existe en el mismo videojuego (falla)
        use_case, uow, _ = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png", rank_per_role=True)
        role1 = Role(role_id=1, name="Mid", videogame=vg, icon_url="/mid.png")
        role2 = Role(role_id=2, name="Top", videogame=vg, icon_url="/top.png")

        uow.role_repo.get_role_by_id.return_value = role1
        uow.role_repo.get_role_by_name_and_videogame.return_value = role2

        with pytest.raises(DuplicateRoleNameException) as exc_info:
            use_case.execute(role_id=1, name="Top", icon=None)

        assert exc_info.value.status_code == 409

    def test_update_role_duplicate_name_different_game_passes(self, mock_deps):
        # Probar modificar un rol asignando un nombre que ya existe pero en otro videojuego diferente (pasa)
        use_case, uow, storage_service = mock_deps

        vg1 = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png", rank_per_role=True)
        role_game1 = Role(role_id=1, name="Mid", videogame=vg1, icon_url="/mid.png")

        # In Game 1, only role_game1 exists. (In Game 2, "Duelist" exists, but get_roles_by_game_id(1) doesn't include it)
        uow.role_repo.get_role_by_id.return_value = role_game1
        uow.role_repo.get_roles_by_game_id.return_value = [role_game1]
        uow.role_repo.update_role.side_effect = lambda r: r

        result = use_case.execute(role_id=1, name="Duelist", icon=None)

        assert result.role_id == 1
        assert result.name == "Duelist"
        uow.role_repo.update_role.assert_called_once()

    def test_update_role_db_error_cleans_up_new_icon(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png", rank_per_role=True)
        role = Role(role_id=1, name="Mid", videogame=vg, icon_url="/mid_old.png")
        uow.role_repo.get_role_by_id.return_value = role
        uow.role_repo.get_roles_by_game_id.return_value = [role]
        uow.role_repo.update_role.side_effect = RuntimeError("DB update failure")

        mock_icon = MagicMock()
        mock_icon.filename = "mid_new.png"
        mock_icon.file = MagicMock()

        with pytest.raises(RuntimeError):
            use_case.execute(role_id=1, name="Mid New", icon=mock_icon)

        storage_service.delete_file.assert_any_call("/media/games/league_of_legends/roles/mid_new.png")
