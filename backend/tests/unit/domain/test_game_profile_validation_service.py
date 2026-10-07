import pytest
from app.domain.services.game_profile_validation_service import GameProfileValidationService
from app.domain.models.videogame import Videogame
from app.domain.models.character import Character
from app.domain.models.role import Role
from app.domain.models.rank import Rank
from app.domain.exceptions.does_not_belong_to_game_exception import DoesNotBelongToGameException


class TestGameProfileValidationService:

    @pytest.fixture
    def videogames(self):
        vg1 = Videogame(1, "League of Legends", "/icon1.png", True)
        vg2 = Videogame(2, "Valorant", "/icon2.png", False)
        return vg1, vg2

    def test_character_belongs_to_game_success(self, videogames):
        vg1, _ = videogames
        char = Character(10, "Ahri", vg1, "/ahri.png")
        # Should not raise
        GameProfileValidationService.validate_character_belongs_to_game(char, 1, "League of Legends")

    def test_character_does_not_belong_to_game_raises_exception(self, videogames):
        vg1, vg2 = videogames
        char = Character(10, "Ahri", vg1, "/ahri.png")
        with pytest.raises(DoesNotBelongToGameException) as exc_info:
            GameProfileValidationService.validate_character_belongs_to_game(char, 2, "Valorant")
        assert exc_info.value.status_code == 400
        assert "Ahri" in exc_info.value.message

    def test_role_belongs_to_game_success(self, videogames):
        vg1, _ = videogames
        role = Role(100, "Mid", vg1, "/mid.png")
        # Should not raise
        GameProfileValidationService.validate_role_belongs_to_game(role, 1, "League of Legends")

    def test_role_does_not_belong_to_game_raises_exception(self, videogames):
        vg1, _ = videogames
        role = Role(100, "Mid", vg1, "/mid.png")
        with pytest.raises(DoesNotBelongToGameException) as exc_info:
            GameProfileValidationService.validate_role_belongs_to_game(role, 2, "Valorant")
        assert exc_info.value.status_code == 400
        assert "Mid" in exc_info.value.message

    def test_rank_belongs_to_game_success(self, videogames):
        vg1, _ = videogames
        rank = Rank(1000, "Gold", 1000, vg1, "/gold.png")
        # Should not raise
        GameProfileValidationService.validate_rank_belongs_to_game(rank, 1, "League of Legends")

    def test_rank_does_not_belong_to_game_raises_exception(self, videogames):
        vg1, _ = videogames
        rank = Rank(1000, "Gold", 1000, vg1, "/gold.png")
        with pytest.raises(DoesNotBelongToGameException) as exc_info:
            GameProfileValidationService.validate_rank_belongs_to_game(rank, 2, "Valorant")
        assert exc_info.value.status_code == 400
        assert "Gold" in exc_info.value.message
