import pytest
from app.domain.services.static_validation_service import StaticValidationService
from app.domain.exceptions.character.invalid_character_name_exception import InvalidCharacterNameException
from app.domain.exceptions.user.invalid_username_exception import InvalidUsernameException
from app.domain.exceptions.videogame.invalid_videogame_name_exception import InvalidVideogameNameException


class TestStaticValidationService:

    @pytest.mark.parametrize("valid_name, expected", [
        ("Jett", "Jett"),
        ("  Jett  ", "Jett"),
        ("Ahri Spirit Blossom", "Ahri Spirit Blossom"),
        ("  Sage  ", "Sage"),
    ])
    def test_validate_character_name_format_valid(self, valid_name, expected):
        result = StaticValidationService.validate_character_name_format(valid_name)
        assert result == expected

    @pytest.mark.parametrize("invalid_name", ["", "   ", None])
    def test_validate_character_name_format_invalid(self, invalid_name):
        with pytest.raises(InvalidCharacterNameException) as exc_info:
            StaticValidationService.validate_character_name_format(invalid_name)
        assert exc_info.value.status_code == 400

    @pytest.mark.parametrize("valid_username", [
        "gamer123",
        "  gamer123  ",
        "john_doe",
        "player",
    ])
    def test_validate_username_format_valid(self, valid_username):
        result = StaticValidationService.validate_username_format(valid_username)
        assert result is True

    @pytest.mark.parametrize("invalid_username", ["", "   ", None])
    def test_validate_username_format_invalid(self, invalid_username):
        with pytest.raises(InvalidUsernameException) as exc_info:
            StaticValidationService.validate_username_format(invalid_username)
        assert exc_info.value.status_code == 400

    @pytest.mark.parametrize("valid_name, expected", [
        ("Valorant", "Valorant"),
        ("  League of Legends  ", "League of Legends"),
        ("Counter Strike 2", "Counter Strike 2"),
    ])
    def test_validate_videogame_name_format_valid(self, valid_name, expected):
        result = StaticValidationService.validate_videogame_name_format(valid_name)
        assert result == expected

    @pytest.mark.parametrize("invalid_name", ["", "   ", None])
    def test_validate_videogame_name_format_invalid(self, invalid_name):
        with pytest.raises(InvalidVideogameNameException) as exc_info:
            StaticValidationService.validate_videogame_name_format(invalid_name)
        assert exc_info.value.status_code == 400
