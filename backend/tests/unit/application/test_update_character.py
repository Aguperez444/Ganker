from unittest.mock import AsyncMock, MagicMock
import pytest

from app.application.useCases.update_character import UpdateCharacter
from app.application.ports.i_storage_service import IStorageService
from app.domain.models.videogame import Videogame
from app.domain.models.character import Character
from app.domain.exceptions.character.invalid_character_name_exception import InvalidCharacterNameException
from app.domain.exceptions.character.duplicated_character_name_exception import DuplicatedCharacterNameException
from app.domain.exceptions.character.character_not_found_exception import CharacterNotFoundException
from app.domain.exceptions.videogame.videogame_not_found_exception import VideogameNotFoundException


class TestUpdateCharacterUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.videogame_repo = MagicMock()
        uow.character_repo = MagicMock()

        storage_service = MagicMock(spec=IStorageService)
        storage_service.save_file = AsyncMock(return_value="/media/games/lol/characters/new_ahri.png")

        use_case = UpdateCharacter(storage_service=storage_service, uow=uow)
        return use_case, uow, storage_service

    @pytest.mark.anyio
    async def test_update_character_happy_path(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/lol.png")
        uow.videogame_repo.get_videogame_by_id.return_value = vg
        uow.character_repo.get_character_by_name_and_videogame.return_value = None

        existing_char = Character(character_id=10, name="Ahri", videogame=vg, icon_url="/old.png")
        uow.character_repo.get_character_by_id.return_value = existing_char
        uow.character_repo.update_character.side_effect = lambda c: c

        mock_icon = MagicMock()
        mock_icon.filename = "new_ahri.png"

        result = await use_case.execute(character_id=10, name="Ahri Spirit", videogame_id=1, icon=mock_icon)

        assert result.character_id == 10
        assert result.name == "Ahri Spirit"
        assert result.icon_url == "/media/games/lol/characters/new_ahri.png"

        storage_service.save_file.assert_called_once()
        uow.character_repo.update_character.assert_called_once()

    @pytest.mark.anyio
    async def test_update_character_empty_name(self, mock_deps):
        use_case, _, _ = mock_deps

        with pytest.raises(InvalidCharacterNameException) as exc_info:
            await use_case.execute(character_id=10, name="  ", videogame_id=1, icon=None)

        assert exc_info.value.status_code == 400

    @pytest.mark.anyio
    async def test_update_character_videogame_not_found(self, mock_deps):
        use_case, uow, _ = mock_deps
        uow.videogame_repo.get_videogame_by_id.return_value = None

        with pytest.raises(VideogameNotFoundException) as exc_info:
            await use_case.execute(character_id=10, name="Ahri", videogame_id=999, icon=None)

        assert exc_info.value.status_code == 404

    @pytest.mark.anyio
    async def test_update_character_duplicate_name_with_different_id(self, mock_deps):
        use_case, uow, _ = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png")
        uow.videogame_repo.get_videogame_by_id.return_value = vg

        other_char = Character(character_id=20, name="Yasuo", videogame=vg, icon_url="/yasuo.png")
        uow.character_repo.get_character_by_name_and_videogame.return_value = other_char

        with pytest.raises(DuplicatedCharacterNameException) as exc_info:
            await use_case.execute(character_id=10, name="Yasuo", videogame_id=1, icon=None)

        assert exc_info.value.status_code == 400

    @pytest.mark.anyio
    async def test_update_character_not_found(self, mock_deps):
        use_case, uow, _ = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png")
        uow.videogame_repo.get_videogame_by_id.return_value = vg
        uow.character_repo.get_character_by_name_and_videogame.return_value = None
        uow.character_repo.get_character_by_id.return_value = None

        with pytest.raises(CharacterNotFoundException) as exc_info:
            await use_case.execute(character_id=999, name="Unknown", videogame_id=1, icon=None)

        assert exc_info.value.status_code == 404
