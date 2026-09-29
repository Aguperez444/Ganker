import pytest
from unittest.mock import MagicMock

from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.models.videogame import Videogame
from app.domain.models.role import Role
from app.domain.models.rank import Rank
from app.domain.models.character import Character
from app.domain.models.game_profile import GameProfile
from app.domain.models.user import User
from app.domain.models.user_role import UserRole

from app.domain.exceptions.videogame.videogame_not_found_exception import VideogameNotFoundException
from app.domain.exceptions.videogame.videogame_already_exists_exception import VideogameAlreadyExistsException
from app.domain.exceptions.role.role_not_found_exception import RoleNotFoundException
from app.domain.exceptions.rank.rank_not_found_exception import RankNotFoundException
from app.domain.exceptions.character.character_not_found_exception import CharacterNotFoundException
from app.domain.exceptions.character.duplicated_character_name_exception import DuplicatedCharacterNameException
from app.domain.exceptions.game_profile.game_profile_not_found_exception import GameProfileNotFoundException
from app.domain.exceptions.game_profile.does_not_belong_to_profile_exception import DoesNotBelongToProfileException
from app.domain.exceptions.game_profile.game_profile_already_exist_exception import GameProfileAlreadyExistException
from app.domain.exceptions.user.username_already_exists_exception import UsernameAlreadyExistsException
from app.domain.exceptions.mail.email_already_exists_exception import EmailAlreadyExistsException


class TestCatalogValidationService:

    @pytest.fixture
    def mock_uow(self):
        uow = MagicMock()
        uow.videogame_repo = MagicMock()
        uow.role_repo = MagicMock()
        uow.rank_repo = MagicMock()
        uow.character_repo = MagicMock()
        uow.game_profile_repo = MagicMock()
        uow.user_repo = MagicMock()
        return uow

    # Videogame existence
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

    # Role existence
    def test_get_role_exists(self, mock_uow):
        role = Role(1, "Mid", MagicMock(), "/mid.png")
        mock_uow.role_repo.get_role_by_id.return_value = role

        result = CatalogValidationService.get_and_validate_exist_role(1, mock_uow)
        assert result == role

    def test_get_role_not_found(self, mock_uow):
        mock_uow.role_repo.get_role_by_id.return_value = None

        with pytest.raises(RoleNotFoundException) as exc_info:
            CatalogValidationService.get_and_validate_exist_role(999, mock_uow)
        assert exc_info.value.status_code == 404

    # Rank existence
    def test_get_rank_exists(self, mock_uow):
        rank = Rank(1, "Gold", 1000, MagicMock(), "/gold.png")
        mock_uow.rank_repo.get_rank_by_id.return_value = rank

        result = CatalogValidationService.get_and_validate_exist_rank(1, mock_uow)
        assert result == rank

    def test_get_rank_not_found(self, mock_uow):
        mock_uow.rank_repo.get_rank_by_id.return_value = None

        with pytest.raises(RankNotFoundException) as exc_info:
            CatalogValidationService.get_and_validate_exist_rank(999, mock_uow)
        assert exc_info.value.status_code == 404

    # Character existence
    def test_get_character_exists(self, mock_uow):
        char = Character(1, "Ahri", MagicMock(), "/ahri.png")
        mock_uow.character_repo.get_character_by_id.return_value = char

        result = CatalogValidationService.get_and_validate_exist_character(1, mock_uow)
        assert result == char

    def test_get_character_not_found(self, mock_uow):
        mock_uow.character_repo.get_character_by_id.return_value = None

        with pytest.raises(CharacterNotFoundException) as exc_info:
            CatalogValidationService.get_and_validate_exist_character(999, mock_uow)
        assert exc_info.value.status_code == 404

    # GameProfile existence & ownership
    def test_get_game_profile_exists_and_belongs_to_player(self, mock_uow):
        profile = GameProfile(10, 5, MagicMock(), [], [])
        mock_uow.game_profile_repo.get_game_profile_by_id.return_value = profile

        result = CatalogValidationService.get_and_validate_exists_game_profile(10, 5, mock_uow)
        assert result == profile

    def test_get_game_profile_not_found(self, mock_uow):
        mock_uow.game_profile_repo.get_game_profile_by_id.return_value = None

        with pytest.raises(GameProfileNotFoundException) as exc_info:
            CatalogValidationService.get_and_validate_exists_game_profile(999, 5, mock_uow)
        assert exc_info.value.status_code == 404

    def test_get_game_profile_does_not_belong_to_player(self, mock_uow):
        profile = GameProfile(10, 5, MagicMock(), [], [])
        mock_uow.game_profile_repo.get_game_profile_by_id.return_value = profile

        with pytest.raises(DoesNotBelongToProfileException) as exc_info:
            CatalogValidationService.get_and_validate_exists_game_profile(10, 999, mock_uow)
        assert exc_info.value.status_code == 400

    # New character name uniqueness
    def test_validate_new_character_name_uniqueness_success(self, mock_uow):
        mock_uow.character_repo.get_character_by_name_and_videogame.return_value = None

        result = CatalogValidationService.validate_new_character_name_uniqueness("Jett", 1, mock_uow)
        assert result is True

    def test_validate_new_character_name_uniqueness_duplicated(self, mock_uow):
        existing_char = Character(1, "Jett", MagicMock(), "/jett.png")
        mock_uow.character_repo.get_character_by_name_and_videogame.return_value = existing_char

        with pytest.raises(DuplicatedCharacterNameException) as exc_info:
            CatalogValidationService.validate_new_character_name_uniqueness("Jett", 1, mock_uow)
        assert exc_info.value.status_code == 409

    # Existing character name uniqueness (update)
    def test_validate_character_name_uniqueness_same_id(self, mock_uow):
        existing_char = Character(10, "Jett", MagicMock(), "/jett.png")
        mock_uow.character_repo.get_character_by_name_and_videogame.return_value = existing_char

        result = CatalogValidationService.validate_character_name_uniqueness(10, "Jett", 1, mock_uow)
        assert result is True

    def test_validate_character_name_uniqueness_different_id(self, mock_uow):
        existing_char = Character(20, "Jett", MagicMock(), "/jett.png")
        mock_uow.character_repo.get_character_by_name_and_videogame.return_value = existing_char

        with pytest.raises(DuplicatedCharacterNameException) as exc_info:
            CatalogValidationService.validate_character_name_uniqueness(10, "Jett", 1, mock_uow)
        assert exc_info.value.status_code == 409

    def test_validate_character_name_uniqueness_not_found(self, mock_uow):
        mock_uow.character_repo.get_character_by_name_and_videogame.return_value = None

        result = CatalogValidationService.validate_character_name_uniqueness(10, "NewName", 1, mock_uow)
        assert result is True

    # New videogame name uniqueness
    def test_validate_new_videogame_name_uniqueness_success(self, mock_uow):
        mock_uow.videogame_repo.get_videogame_by_name.return_value = None

        result = CatalogValidationService.validate_new_videogame_name_uniqueness("Valorant", mock_uow)
        assert result is True
        mock_uow.videogame_repo.get_videogame_by_name.assert_called_once_with("valorant")

    def test_validate_new_videogame_name_uniqueness_duplicated(self, mock_uow):
        existing_game = Videogame(1, "Valorant", "/val.png", False)
        mock_uow.videogame_repo.get_videogame_by_name.return_value = existing_game

        with pytest.raises(VideogameAlreadyExistsException) as exc_info:
            CatalogValidationService.validate_new_videogame_name_uniqueness("Valorant", mock_uow)
        assert exc_info.value.status_code == 409

    # Existing videogame name uniqueness (update)
    def test_validate_videogame_name_uniqueness_same_id(self, mock_uow):
        existing_game = Videogame(1, "Valorant", "/val.png", False)
        mock_uow.videogame_repo.get_videogame_by_name.return_value = existing_game

        result = CatalogValidationService.validate_videogame_name_uniqueness("Valorant", 1, mock_uow)
        assert result is True

    def test_validate_videogame_name_uniqueness_different_id(self, mock_uow):
        existing_game = Videogame(2, "Valorant", "/val.png", False)
        mock_uow.videogame_repo.get_videogame_by_name.return_value = existing_game

        with pytest.raises(VideogameAlreadyExistsException) as exc_info:
            CatalogValidationService.validate_videogame_name_uniqueness("Valorant", 1, mock_uow)
        assert exc_info.value.status_code == 409

    def test_validate_videogame_name_uniqueness_not_found(self, mock_uow):
        mock_uow.videogame_repo.get_videogame_by_name.return_value = None

        result = CatalogValidationService.validate_videogame_name_uniqueness("New Game", 1, mock_uow)
        assert result is True

    # Username uniqueness (update)
    def test_validate_username_uniqueness_same_id(self, mock_uow):
        existing_user = User(1, "gamer", "Gamer", "g@g.com", "hash", UserRole.PLAYER, [])
        mock_uow.user_repo.get_user_by_username.return_value = existing_user

        result = CatalogValidationService.validate_username_uniqueness("gamer", 1, mock_uow)
        assert result is True

    def test_validate_username_uniqueness_different_id(self, mock_uow):
        existing_user = User(2, "gamer", "Gamer", "g@g.com", "hash", UserRole.PLAYER, [])
        mock_uow.user_repo.get_user_by_username.return_value = existing_user

        with pytest.raises(UsernameAlreadyExistsException) as exc_info:
            CatalogValidationService.validate_username_uniqueness("gamer", 1, mock_uow)
        assert exc_info.value.status_code == 409

    def test_validate_username_uniqueness_not_found(self, mock_uow):
        mock_uow.user_repo.get_user_by_username.return_value = None

        result = CatalogValidationService.validate_username_uniqueness("newgamer", 1, mock_uow)
        assert result is True

    # Mail uniqueness (update)
    def test_validate_mail_uniqueness_same_id(self, mock_uow):
        existing_user = User(1, "gamer", "Gamer", "g@g.com", "hash", UserRole.PLAYER, [])
        mock_uow.user_repo.get_user_by_mail.return_value = existing_user

        result = CatalogValidationService.validate_mail_uniqueness("g@g.com", 1, mock_uow)
        assert result is True

    def test_validate_mail_uniqueness_different_id(self, mock_uow):
        existing_user = User(2, "gamer", "Gamer", "g@g.com", "hash", UserRole.PLAYER, [])
        mock_uow.user_repo.get_user_by_mail.return_value = existing_user

        with pytest.raises(EmailAlreadyExistsException) as exc_info:
            CatalogValidationService.validate_mail_uniqueness("g@g.com", 1, mock_uow)
        assert exc_info.value.status_code == 409

    def test_validate_mail_uniqueness_not_found(self, mock_uow):
        mock_uow.user_repo.get_user_by_mail.return_value = None

        result = CatalogValidationService.validate_mail_uniqueness("new@g.com", 1, mock_uow)
        assert result is True

    # Not duplicated game profile
    def test_validate_not_duplicated_game_profile_success(self, mock_uow):
        mock_uow.game_profile_repo.get_game_profile_by_player_and_videogame.return_value = None

        CatalogValidationService.validate_not_duplicated_game_profile(1, 2, mock_uow)

    def test_validate_not_duplicated_game_profile_duplicated(self, mock_uow):
        existing_profile = GameProfile(10, 1, MagicMock(), [], [])
        mock_uow.game_profile_repo.get_game_profile_by_player_and_videogame.return_value = existing_profile

        with pytest.raises(GameProfileAlreadyExistException) as exc_info:
            CatalogValidationService.validate_not_duplicated_game_profile(1, 2, mock_uow)
        assert exc_info.value.status_code == 400

    # is_duplicated_username
    def test_is_duplicated_username_true(self, mock_uow):
        existing_user = User(1, "gamer", "Gamer", "g@g.com", "hash", UserRole.PLAYER, [])
        mock_uow.user_repo.get_user_by_username.return_value = existing_user

        assert CatalogValidationService.is_duplicated_username("gamer", mock_uow) is True

    def test_is_duplicated_username_false(self, mock_uow):
        mock_uow.user_repo.get_user_by_username.return_value = None

        assert CatalogValidationService.is_duplicated_username("nonexistent", mock_uow) is False

    # is_duplicated_mail
    def test_is_duplicated_mail_true(self, mock_uow):
        existing_user = User(1, "gamer", "Gamer", "g@g.com", "hash", UserRole.PLAYER, [])
        mock_uow.user_repo.get_user_by_mail.return_value = existing_user

        assert CatalogValidationService.is_duplicated_mail("g@g.com", mock_uow) is True

    def test_is_duplicated_mail_false(self, mock_uow):
        mock_uow.user_repo.get_user_by_mail.return_value = None

        assert CatalogValidationService.is_duplicated_mail("nonexistent@g.com", mock_uow) is False
