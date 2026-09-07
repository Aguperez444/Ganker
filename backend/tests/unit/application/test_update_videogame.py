from unittest.mock import AsyncMock, MagicMock
import pytest

from app.application.useCases.update_videogame import UpdateVideogame
from app.application.ports.i_storage_service import IStorageService
from app.domain.models.videogame import Videogame
from app.domain.exceptions.videogame.videogame_not_found_exception import VideogameNotFoundException
from app.domain.exceptions.videogame.videogame_already_exists_exception import VideogameAlreadyExistsException


class TestUpdateVideogameUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.videogame_repo = MagicMock()

        storage_service = MagicMock(spec=IStorageService)
        storage_service.save_file = AsyncMock(return_value="/media/games/lol/new_icon.png")
        storage_service.delete_file = AsyncMock(return_value=True)

        use_case = UpdateVideogame(storage_service=storage_service, unit_of_work=uow)
        return use_case, uow, storage_service

    @pytest.mark.anyio
    async def test_update_videogame_happy_path(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        existing = Videogame(videogame_id=1, name="LoL", icon_url="/media/games/lol/old.png")
        uow.videogame_repo.get_videogame_by_id.return_value = existing
        uow.videogame_repo.get_videogame_by_name.return_value = None
        uow.videogame_repo.update_videogame.side_effect = lambda g: g

        mock_icon = MagicMock()
        mock_icon.filename = "new_logo.png"
        mock_icon.file = MagicMock()

        result = await use_case.execute(videogame_id=1, name="League of Legends", icon=mock_icon)

        assert result.id == 1
        assert result.name == "League of Legends"
        assert result.icon_url == "/media/games/lol/new_icon.png"

        storage_service.delete_file.assert_called_once_with("/media/games/lol/old.png")
        storage_service.save_file.assert_called_once()
        uow.videogame_repo.update_videogame.assert_called_once()

    @pytest.mark.anyio
    async def test_update_videogame_not_found(self, mock_deps):
        use_case, uow, _ = mock_deps
        uow.videogame_repo.get_videogame_by_id.return_value = None

        with pytest.raises(VideogameNotFoundException) as exc_info:
            await use_case.execute(videogame_id=999, name="LoL", icon=MagicMock())

        assert exc_info.value.status_code == 404

    @pytest.mark.anyio
    async def test_update_videogame_name_collision_with_other_game(self, mock_deps):
        use_case, uow, _ = mock_deps

        existing = Videogame(videogame_id=1, name="Game 1", icon_url="/icon.png")
        other_game = Videogame(videogame_id=2, name="Game 2", icon_url="/icon2.png")
        uow.videogame_repo.get_videogame_by_id.return_value = existing
        uow.videogame_repo.get_videogame_by_name.return_value = other_game

        with pytest.raises(VideogameAlreadyExistsException) as exc_info:
            await use_case.execute(videogame_id=1, name="Game 2", icon=None)

        assert exc_info.value.status_code == 409
