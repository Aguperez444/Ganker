import pytest
from app.domain.exceptions.domain_exception import DomainException
from app.domain.exceptions.Invalid_token_exception import InvalidTokenException
from app.domain.exceptions.character_not_found_exception import CharacterNotFoundException
from app.domain.exceptions.email_already_exists_exception import EmailAlreadyExistsException
from app.domain.exceptions.game_profile_already_exist_exception import GameProfileAlreadyExistException
from app.domain.exceptions.game_profile_not_found_exception import GameProfileNotFoundException
from app.domain.exceptions.invalid_username_exception import InvalidUsernameException
from app.domain.exceptions.mail_not_found_exception import EmailNotFoundException
from app.domain.exceptions.password_is_not_secure_exception import PasswordIsNotSecureException
from app.domain.exceptions.rank_not_found_exception import RankNotFoundException
from app.domain.exceptions.role_not_found_exception import RoleNotFoundException
from app.domain.exceptions.user_not_found_exception import UserNotFoundException
from app.domain.exceptions.username_already_exist_exception import UsernameAlreadyExistsException
from app.domain.exceptions.videogame_not_found_exception import VideogameNotFoundException
from app.domain.exceptions.wrong_password_exception import WrongPasswordException


class TestDomainExceptions:

    def test_domain_exception_base(self):
        exc = DomainException(message="General domain error", status_code=400)
        assert exc.message == "General domain error"
        assert exc.status_code == 400
        assert isinstance(exc, Exception)

    def test_invalid_token_exception(self):
        exc = InvalidTokenException()
        assert exc.status_code == 401
        assert "Token inválido" in exc.message

        custom_exc = InvalidTokenException("Custom token error")
        assert custom_exc.status_code == 401
        assert custom_exc.message == "Custom token error"

    def test_character_not_found_exception(self):
        exc = CharacterNotFoundException(character_id=42)
        assert exc.status_code == 404
        assert "42" in exc.message

    def test_email_already_exists_exception(self):
        exc = EmailAlreadyExistsException(email="test@example.com")
        assert exc.status_code == 409
        assert "test@example.com" in exc.message

    def test_game_profile_already_exist_exception(self):
        exc = GameProfileAlreadyExistException(player_id=1, videogame_id=2)
        assert exc.status_code == 400
        assert "1" in exc.message
        assert "2" in exc.message

    def test_game_profile_not_found_exception(self):
        exc = GameProfileNotFoundException(game_profile_id=10)
        assert exc.status_code == 404
        assert "10" in exc.message

    def test_invalid_username_exception(self):
        exc = InvalidUsernameException(username="bad name")
        assert exc.status_code == 400
        assert "bad name" in exc.message

    def test_email_not_found_exception(self):
        exc = EmailNotFoundException(email="notfound@example.com")
        assert exc.status_code == 404
        assert "notfound@example.com" in exc.message

    def test_password_is_not_secure_exception(self):
        exc = PasswordIsNotSecureException(msg_reason="Demasiado corta")
        assert exc.status_code == 400
        assert "Demasiado corta" in exc.message

    def test_rank_not_found_exception(self):
        exc = RankNotFoundException(rank_id=5)
        assert exc.status_code == 404
        assert "5" in exc.message

    def test_role_not_found_exception(self):
        exc = RoleNotFoundException(role_id=3)
        assert exc.status_code == 404
        assert "3" in exc.message

    def test_user_not_found_exception(self):
        exc = UserNotFoundException()
        assert exc.status_code == 404
        assert "cuenta registrada" in exc.message

    def test_username_already_exists_exception(self):
        exc = UsernameAlreadyExistsException(username="existing_user")
        assert exc.status_code == 409
        assert "existing_user" in exc.message

    def test_videogame_not_found_exception(self):
        exc = VideogameNotFoundException(videogame_id=99)
        assert exc.status_code == 404
        assert "99" in exc.message

    def test_wrong_password_exception(self):
        exc = WrongPasswordException(email="test@example.com")
        assert exc.status_code == 401
        assert "test@example.com" in exc.message
