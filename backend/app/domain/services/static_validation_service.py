from app.domain.exceptions.character.invalid_character_name_exception import InvalidCharacterNameException
from app.domain.exceptions.user.invalid_username_exception import InvalidUsernameException
from app.domain.exceptions.videogame.invalid_videogame_name_exception import InvalidVideogameNameException


class StaticValidationService:
    @staticmethod
    def validate_character_name_format(name: str) -> str:
        if not name or not name.strip():
            raise InvalidCharacterNameException(name)
        return name.strip()

    @staticmethod
    def validate_username_format(username: str) -> bool:
        if username is None or username.strip():
            raise InvalidUsernameException(username)
        return True

    @staticmethod
    def validate_videogame_name_format(name: str) -> str:
        if not name or not name.strip():
            raise InvalidVideogameNameException(name)
        return name.strip()
