from unittest.mock import AsyncMock, MagicMock
import pytest

from app.application.useCases.register_character import RegisterCharacter
from app.application.ports.i_storage_service import IStorageService
from app.domain.models.videogame import Videogame
from app.domain.models.character import Character
from app.domain.exceptions.character.invalid_character_name_exception import InvalidCharacterNameException
from app.domain.exceptions.character.duplicated_character_name_exception import DuplicatedCharacterNameException
from app.domain.exceptions.videogame.videogame_not_found_exception import VideogameNotFoundException
from exceptions.file.file_not_null_exception import FileNotNullException
from exceptions.file.file_name_not_null_exception import FileNameNotNullException


class TestRegisterCharacterUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.videogame_repo = MagicMock()
        uow.character_repo = MagicMock()

        storage_service = MagicMock(spec=IStorageService)
        storage_service.save_file = AsyncMock(return_value="/media/games/lol/characters/ahri.png")
        storage_service.delete_file = AsyncMock(return_value=True)

        use_case = RegisterCharacter(storage_service=storage_service, unit_of_work=uow)
        return use_case, uow, storage_service

    @pytest.mark.anyio
    async def test_register_character_happy_path(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="League of Legends", icon_url="/lol.png")
        uow.videogame_repo.get_videogame_by_id.return_value = vg
        uow.character_repo.get_character_by_name_and_videogame.return_value = None

        saved_char = Character(character_id=10, name="Ahri", videogame=vg, icon_url="/media/games/lol/characters/ahri.png")
        uow.character_repo.create_character.return_value = saved_char

        result = await use_case.execute(
            name="Ahri",
            videogame_id=1,
            icon_file=MagicMock(),
            icon_filename="ahri.png"
        )

        assert result.character_id == 10
        assert result.name == "Ahri"
        assert result.icon_url == "/media/games/lol/characters/ahri.png"

        storage_service.save_file.assert_called_once()
        uow.character_repo.create_character.assert_called_once()

    @pytest.mark.anyio
    async def test_register_character_empty_name_raises_invalid_name(self, mock_deps):
        use_case, _, _ = mock_deps

        with pytest.raises(InvalidCharacterNameException) as exc_info:
            await use_case.execute(name="   ", videogame_id=1, icon_file=MagicMock(), icon_filename="ahri.png")

        assert exc_info.value.status_code == 400

    @pytest.mark.anyio
    async def test_register_character_game_not_found(self, mock_deps):
        use_case, uow, _ = mock_deps
        uow.videogame_repo.get_videogame_by_id.return_value = None

        with pytest.raises(VideogameNotFoundException) as exc_info:
            await use_case.execute(name="Ahri", videogame_id=999, icon_file=MagicMock(), icon_filename="ahri.png")

        assert exc_info.value.status_code == 404

    @pytest.mark.anyio
    async def test_register_character_duplicate_name_in_same_game(self, mock_deps):
        use_case, uow, _ = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png")
        uow.videogame_repo.get_videogame_by_id.return_value = vg
        existing = Character(character_id=1, name="Ahri", videogame=vg, icon_url="/icon.png")
        uow.character_repo.get_character_by_name_and_videogame.return_value = existing

        with pytest.raises(DuplicatedCharacterNameException) as exc_info:
            await use_case.execute(name="Ahri", videogame_id=1, icon_file=MagicMock(), icon_filename="ahri.png")

        assert exc_info.value.status_code == 400

    @pytest.mark.anyio
    async def test_register_character_missing_file_raises_exception(self, mock_deps):
        use_case, uow, _ = mock_deps
        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png")
        uow.videogame_repo.get_videogame_by_id.return_value = vg
        uow.character_repo.get_character_by_name_and_videogame.return_value = None

        with pytest.raises(FileNotNullException) as exc_info:
            await use_case.execute(name="Ahri", videogame_id=1, icon_file=None, icon_filename="ahri.png")

        assert exc_info.value.status_code == 400

    @pytest.mark.anyio
    async def test_register_character_missing_filename_raises_exception(self, mock_deps):
        use_case, uow, _ = mock_deps
        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png")
        uow.videogame_repo.get_videogame_by_id.return_value = vg
        uow.character_repo.get_character_by_name_and_videogame.return_value = None

        with pytest.raises(FileNameNotNullException) as exc_info:
            await use_case.execute(name="Ahri", videogame_id=1, icon_file=MagicMock(), icon_filename="")

        assert exc_info.value.status_code == 400

    @pytest.mark.anyio
    async def test_register_character_db_error_cleans_up_file(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png")
        uow.videogame_repo.get_videogame_by_id.return_value = vg
        uow.character_repo.get_character_by_name_and_videogame.return_value = None
        uow.character_repo.create_character.side_effect = RuntimeError("DB error")

        with pytest.raises(RuntimeError):
            await use_case.execute(name="Ahri", videogame_id=1, icon_file=MagicMock(), icon_filename="ahri.png")

        storage_service.delete_file.assert_called_once_with("/media/games/lol/characters/ahri.png")
