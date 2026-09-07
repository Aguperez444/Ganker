from unittest.mock import AsyncMock, MagicMock
import pytest

from app.application.useCases.register_videogame import RegisterVideogame
from app.application.ports.i_storage_service import IStorageService
from app.domain.models.videogame import Videogame
from app.domain.exceptions.videogame.invalid_videogame_name_exception import InvalidVideogameNameException
from app.domain.exceptions.videogame.videogame_already_exists_exception import VideogameAlreadyExistsException
from app.domain.exceptions.file_not_null_exception import FileNotNullException
from app.domain.exceptions.file_name_not_null_exception import FileNameNotNullException


class TestRegisterVideogameUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.videogame_repo = MagicMock()

        storage_service = MagicMock(spec=IStorageService)
        storage_service.save_file = AsyncMock(return_value="/media/games/valorant/icon.png")
        storage_service.delete_file = AsyncMock(return_value=True)

        use_case = RegisterVideogame(storage_service=storage_service, unit_of_work=uow)
        return use_case, uow, storage_service

    @pytest.mark.anyio
    async def test_register_videogame_happy_path(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        uow.videogame_repo.get_videogame_by_name.return_value = None
        saved_game = Videogame(videogame_id=1, name="Valorant", icon_url="/media/games/valorant/icon.png")
        uow.videogame_repo.register_videogame.return_value = saved_game

        fake_file = MagicMock()
        result = await use_case.execute(name="Valorant", icon_file=fake_file, icon_filename="logo.png")

        assert result.id == 1
        assert result.name == "Valorant"
        assert result.icon_url == "/media/games/valorant/icon.png"

        storage_service.save_file.assert_called_once()
        uow.videogame_repo.register_videogame.assert_called_once()

    @pytest.mark.anyio
    async def test_register_videogame_empty_name_raises_invalid_name(self, mock_deps):
        use_case, _, _ = mock_deps

        with pytest.raises(InvalidVideogameNameException) as exc_info:
            await use_case.execute(name="   ", icon_file=MagicMock(), icon_filename="icon.png")

        assert exc_info.value.status_code == 400

    @pytest.mark.anyio
    async def test_register_videogame_already_exists_raises_conflict(self, mock_deps):
        use_case, uow, _ = mock_deps

        existing = Videogame(videogame_id=2, name="Valorant", icon_url="/icon.png")
        uow.videogame_repo.get_videogame_by_name.return_value = existing

        with pytest.raises(VideogameAlreadyExistsException) as exc_info:
            await use_case.execute(name="Valorant", icon_file=MagicMock(), icon_filename="icon.png")

        assert exc_info.value.status_code == 409
        assert "Valorant" in exc_info.value.message

    @pytest.mark.anyio
    async def test_register_videogame_missing_file_raises_exception(self, mock_deps):
        use_case, uow, _ = mock_deps
        uow.videogame_repo.get_videogame_by_name.return_value = None

        with pytest.raises(FileNotNullException) as exc_info:
            await use_case.execute(name="Dota 2", icon_file=None, icon_filename="icon.png")

        assert exc_info.value.status_code == 400

    @pytest.mark.anyio
    async def test_register_videogame_missing_filename_raises_exception(self, mock_deps):
        use_case, uow, _ = mock_deps
        uow.videogame_repo.get_videogame_by_name.return_value = None

        with pytest.raises(FileNameNotNullException) as exc_info:
            await use_case.execute(name="Dota 2", icon_file=MagicMock(), icon_filename="")

        assert exc_info.value.status_code == 400

    @pytest.mark.anyio
    async def test_register_videogame_db_error_deletes_saved_file(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        uow.videogame_repo.get_videogame_by_name.return_value = None
        uow.videogame_repo.register_videogame.side_effect = RuntimeError("DB error")

        with pytest.raises(RuntimeError):
            await use_case.execute(name="New Game", icon_file=MagicMock(), icon_filename="icon.png")

        storage_service.delete_file.assert_called_once_with("/media/games/valorant/icon.png")
