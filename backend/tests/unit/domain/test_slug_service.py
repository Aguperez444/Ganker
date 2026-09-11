import pytest
from app.domain.exceptions.file.invalid_file_extension_error import InvalidFileExtensionError
from app.domain.services.slug_service import SlugService


class TestSlugService:

    def test_to_slug_happy_path(self):
        assert SlugService.to_slug("League of Legends") == "league_of_legends"
        assert SlugService.to_slug("Counter-Strike 2") == "counter-strike_2"

    def test_to_slug_with_accents_and_diacritics(self):
        assert SlugService.to_slug("Pokémon Épée") == "pokemon_epee"
        assert SlugService.to_slug("Año Nuevo 2026!") == "ano_nuevo_2026"

    def test_to_slug_empty_raises_value_error(self):
        with pytest.raises(ValueError) as exc_info:
            SlugService.to_slug("")
        assert "no puede estar vacío" in str(exc_info.value)

        with pytest.raises(ValueError) as exc_info:
            SlugService.to_slug(None)
        assert "no puede estar vacío" in str(exc_info.value)

    def test_sanitize_image_filename_happy_path(self):
        stem, ext = SlugService.sanitize_image_filename("my_cool_icon.PNG")
        assert stem == "my_cool_icon"
        assert ext == "png"

    def test_sanitize_image_filename_with_spaces_and_special_chars(self):
        stem, ext = SlugService.sanitize_image_filename("Super Character Image! (1).JPEG")
        assert stem == "super_character_image___1"
        assert ext == "jpeg"

    def test_sanitize_image_filename_invalid_or_no_extension_raises(self):
        with pytest.raises(InvalidFileExtensionError):
            SlugService.sanitize_image_filename("no_extension_file")

        with pytest.raises(InvalidFileExtensionError):
            SlugService.sanitize_image_filename("dangerous.exe")
