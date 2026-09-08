from unittest.mock import AsyncMock, MagicMock
import pytest

from app.application.use_cases.create_role import CreateRole
from app.application.ports.i_storage_service import IStorageService
from app.domain.models.videogame import Videogame
from app.domain.models.role import Role
from app.domain.exceptions.role.invalid_role_name_exception import InvalidRoleNameException
from app.domain.exceptions.role.duplicated_role_name_exception import DuplicateRoleNameException
from app.domain.exceptions.videogame.videogame_not_found_exception import VideogameNotFoundException
from app.domain.exceptions.file.file_not_null_exception import FileNotNullException
from app.domain.exceptions.file.file_name_not_null_exception import FileNameNotNullException


class TestCreateRoleUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.videogame_repo = MagicMock()
        uow.role_repo = MagicMock()

        storage_service = MagicMock(spec=IStorageService)
        storage_service.save_file = AsyncMock(return_value="/media/games/lol/roles/mid.png")
        storage_service.delete_file = AsyncMock(return_value=True)

        use_case = CreateRole(storage_service=storage_service, uow=uow)
        return use_case, uow, storage_service

    @pytest.mark.anyio
    async def test_create_role_happy_path(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png")
        uow.videogame_repo.get_videogame_by_id.return_value = vg
        uow.role_repo.get_roles_by_game_id.return_value = []

        saved = Role(role_id=10, name="Mid", videogame=vg, icon_url="/media/games/lol/roles/mid.png")
        uow.role_repo.save_role.return_value = saved

        fake_stream = MagicMock()
        res = await use_case.execute(game_id=1, name="Mid", icon_stream=fake_stream, filename="mid.png")

        assert res.role_id == 10
        assert res.name == "Mid"
        assert res.icon_url == "/media/games/lol/roles/mid.png"
        storage_service.save_file.assert_called_once()
        uow.role_repo.save_role.assert_called_once()

    @pytest.mark.anyio
    async def test_create_role_empty_name(self, mock_deps):
        use_case, _, _ = mock_deps

        with pytest.raises(InvalidRoleNameException) as exc_info:
            await use_case.execute(game_id=1, name="  ", icon_stream=MagicMock(), filename="mid.png")

        assert exc_info.value.status_code == 400

    @pytest.mark.anyio
    async def test_create_role_videogame_not_found(self, mock_deps):
        use_case, uow, _ = mock_deps
        uow.videogame_repo.get_videogame_by_id.return_value = None

        with pytest.raises(VideogameNotFoundException) as exc_info:
            await use_case.execute(game_id=999, name="Mid", icon_stream=MagicMock(), filename="mid.png")

        assert exc_info.value.status_code == 404

    @pytest.mark.anyio
    async def test_create_role_duplicate_name(self, mock_deps):
        use_case, uow, _ = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png")
        uow.videogame_repo.get_videogame_by_id.return_value = vg
        existing_role = Role(role_id=1, name="Mid", videogame=vg, icon_url="/mid.png")
        uow.role_repo.get_roles_by_game_id.return_value = [existing_role]

        with pytest.raises(DuplicateRoleNameException) as exc_info:
            await use_case.execute(game_id=1, name="Mid", icon_stream=MagicMock(), filename="mid.png")

        assert exc_info.value.status_code == 409

    @pytest.mark.anyio
    async def test_create_role_missing_stream(self, mock_deps):
        use_case, uow, _ = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png")
        uow.videogame_repo.get_videogame_by_id.return_value = vg
        uow.role_repo.get_roles_by_game_id.return_value = []

        with pytest.raises(FileNotNullException) as exc_info:
            await use_case.execute(game_id=1, name="Mid", icon_stream=None, filename="mid.png")

        assert exc_info.value.status_code == 400

    @pytest.mark.anyio
    async def test_create_role_missing_filename(self, mock_deps):
        use_case, uow, _ = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png")
        uow.videogame_repo.get_videogame_by_id.return_value = vg
        uow.role_repo.get_roles_by_game_id.return_value = []

        with pytest.raises(FileNameNotNullException) as exc_info:
            await use_case.execute(game_id=1, name="Mid", icon_stream=MagicMock(), filename="")

        assert exc_info.value.status_code == 400

    @pytest.mark.anyio
    async def test_create_role_db_error_deletes_file(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png")
        uow.videogame_repo.get_videogame_by_id.return_value = vg
        uow.role_repo.get_roles_by_game_id.return_value = []
        uow.role_repo.save_role.side_effect = RuntimeError("DB error")

        with pytest.raises(RuntimeError):
            await use_case.execute(game_id=1, name="Mid", icon_stream=MagicMock(), filename="mid.png")

        storage_service.delete_file.assert_called_once_with("/media/games/lol/roles/mid.png")
