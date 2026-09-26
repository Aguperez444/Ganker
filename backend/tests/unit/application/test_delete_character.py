from unittest.mock import MagicMock
import pytest

from app.application.use_cases.delete_character import DeleteCharacter
from app.application.ports.i_storage_service import IStorageService
from app.domain.models.videogame import Videogame
from app.domain.models.character import Character
from app.domain.exceptions.character.character_not_found_exception import CharacterNotFoundException


class TestDeleteCharacterUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.character_repo = MagicMock()
        uow.character_priority_repo = MagicMock()

        storage_service = MagicMock(spec=IStorageService)
        storage_service.delete_file = MagicMock(return_value=True)

        use_case = DeleteCharacter(storage_service=storage_service, uow=uow)
        return use_case, uow, storage_service

    def test_delete_character_happy_path_no_dependencies(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png", rank_per_role=True)
        character = Character(character_id=10, name="Ahri", videogame=vg, icon_url="/media/ahri.png")

        uow.character_repo.get_character_by_id.return_value = character
        uow.character_priority_repo.count_associated_to_character.return_value = 0

        res = use_case.execute(character_id=10)

        assert "exitosamente" in res.message.lower()
        uow.character_priority_repo.delete_and_readjust_for_character.assert_not_called()
        uow.character_repo.delete_character.assert_called_once_with(10)
        storage_service.delete_file.assert_called_once_with("/media/ahri.png")

    def test_delete_character_with_associated_profiles_readjusts_priorities(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png", rank_per_role=True)
        character = Character(character_id=10, name="Yasuo", videogame=vg, icon_url="/media/yasuo.png")

        uow.character_repo.get_character_by_id.return_value = character
        uow.character_priority_repo.count_associated_to_character.return_value = 2

        res = use_case.execute(character_id=10)

        assert "exitosamente" in res.message.lower()
        uow.character_priority_repo.delete_and_readjust_for_character.assert_called_once_with(10)
        uow.character_repo.delete_character.assert_called_once_with(10)
        storage_service.delete_file.assert_called_once_with("/media/yasuo.png")

    def test_delete_character_not_found_raises_exception(self, mock_deps):
        use_case, uow, storage_service = mock_deps
        uow.character_repo.get_character_by_id.return_value = None

        with pytest.raises(CharacterNotFoundException) as exc_info:
            use_case.execute(character_id=999)

        assert exc_info.value.status_code == 404
        uow.character_priority_repo.count_associated_to_character.assert_not_called()
        uow.character_repo.delete_character.assert_not_called()
        storage_service.delete_file.assert_not_called()

    def test_delete_character_without_icon_url_does_not_call_storage(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png", rank_per_role=True)
        character = Character(character_id=5, name="NoIconChar", videogame=vg, icon_url="")

        uow.character_repo.get_character_by_id.return_value = character
        uow.character_priority_repo.count_associated_to_character.return_value = 0

        res = use_case.execute(character_id=5)

        assert "exitosamente" in res.message.lower()
        uow.character_repo.delete_character.assert_called_once_with(5)
        storage_service.delete_file.assert_not_called()
