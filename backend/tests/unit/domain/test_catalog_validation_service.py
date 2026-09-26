import pytest
from unittest.mock import MagicMock
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.models.videogame import Videogame
from app.domain.models.role import Role
from app.domain.models.rank import Rank
from app.domain.models.character import Character
from app.domain.exceptions.videogame.videogame_not_found_exception import VideogameNotFoundException
from app.domain.exceptions.role.role_not_found_exception import RoleNotFoundException
from app.domain.exceptions.rank.rank_not_found_exception import RankNotFoundException
from app.domain.exceptions.character.character_not_found_exception import CharacterNotFoundException


class TestCatalogValidationService:

    @pytest.fixture
    def mock_uow(self):
        uow = MagicMock()
        uow.videogame_repo = MagicMock()
        uow.role_repo = MagicMock()
        uow.rank_repo = MagicMock()
        uow.character_repo = MagicMock()
        return uow

    def test_get_videogame_exists(self, mock_uow):
        vg = Videogame(1, "LoL", "/icon.png", True)
        mock_uow.videogame_repo.get_videogame_by_id.return_value = vg

        result = CatalogValidationService.get_and_validate_exist_videogame(1, mock_uow)
        assert result == vg

    def test_get_videogame_not_found(self, mock_uow):
        mock_uow.videogame_repo.get_videogame_by_id.return_value = None

        with pytest.raises(VideogameNotFoundException) as exc_info:
            CatalogValidationService.get_and_validate_exist_videogame(999, mock_uow)
        assert exc_info.value.status_code == 404

    def test_get_role_exists(self, mock_uow):
        role = Role(1, "Mid", MagicMock(), "/mid.png")
        mock_uow.role_repo.get_role_by_id.return_value = role

        result = CatalogValidationService.get_role_and_validate_exist(1, mock_uow)
        assert result == role

    def test_get_role_not_found(self, mock_uow):
        mock_uow.role_repo.get_role_by_id.return_value = None

        with pytest.raises(RoleNotFoundException) as exc_info:
            CatalogValidationService.get_role_and_validate_exist(999, mock_uow)
        assert exc_info.value.status_code == 404

    def test_get_rank_exists(self, mock_uow):
        rank = Rank(1, "Gold", 1000, MagicMock(), "/gold.png")
        mock_uow.rank_repo.get_rank_by_id.return_value = rank

        result = CatalogValidationService.get_rank_and_validate_exist(1, mock_uow)
        assert result == rank

    def test_get_rank_not_found(self, mock_uow):
        mock_uow.rank_repo.get_rank_by_id.return_value = None

        with pytest.raises(RankNotFoundException) as exc_info:
            CatalogValidationService.get_rank_and_validate_exist(999, mock_uow)
        assert exc_info.value.status_code == 404

    def test_get_character_exists(self, mock_uow):
        char = Character(1, "Ahri", MagicMock(), "/ahri.png")
        mock_uow.character_repo.get_character_by_id.return_value = char

        result = CatalogValidationService.get_character_and_validate_exist(1, mock_uow)
        assert result == char

    def test_get_character_not_found(self, mock_uow):
        mock_uow.character_repo.get_character_by_id.return_value = None

        with pytest.raises(CharacterNotFoundException) as exc_info:
            CatalogValidationService.get_character_and_validate_exist(999, mock_uow)
        assert exc_info.value.status_code == 404
