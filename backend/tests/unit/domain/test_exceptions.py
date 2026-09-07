import pytest

from app.domain.exceptions.domain_exception import DomainException
from app.domain.exceptions.Invalid_token_exception import InvalidTokenException
from app.domain.exceptions.password_is_not_secure_exception import PasswordIsNotSecureException
from app.domain.exceptions.wrong_password_exception import WrongPasswordException
from app.domain.exceptions.does_not_belong_to_game_exception import DoesNotBelongToGameException
from app.domain.exceptions.file_name_not_null_exception import FileNameNotNullException
from app.domain.exceptions.file_not_null_exception import FileNotNullException
from app.domain.exceptions.invalid_name_file_exception import InvalidNameFileException

from app.domain.exceptions.character.character_not_found_exception import CharacterNotFoundException
from app.domain.exceptions.character.duplicated_character_name_exception import DuplicatedCharacterNameException
from app.domain.exceptions.character.invalid_character_name_exception import InvalidCharacterNameException

from app.domain.exceptions.game_profile.game_profile_already_exist_exception import GameProfileAlreadyExistException
from app.domain.exceptions.game_profile.game_profile_not_found_exception import GameProfileNotFoundException
from app.domain.exceptions.game_profile.does_not_belong_to_profile_exception import DoesNotBelongToProfileException

from app.domain.exceptions.mail.email_already_exists_exception import EmailAlreadyExistsException
from app.domain.exceptions.mail.mail_not_found_exception import EmailNotFoundException

from app.domain.exceptions.rank.rank_not_found_exception import RankNotFoundException
from app.domain.exceptions.rank.duplicated_rank_name_exception import DuplicatedRankNameException
from app.domain.exceptions.rank.duplicated_rank_value_exception import DuplicatedRankValueException
from app.domain.exceptions.rank.invalid_rank_name_exception import InvalidRankNameException
from app.domain.exceptions.rank.invalid_rank_value_exception import InvalidRankValueException

from app.domain.exceptions.role.role_not_found_exception import RoleNotFoundException
from app.domain.exceptions.role.duplicated_role_name_exception import DuplicateRoleNameException
from app.domain.exceptions.role.invalid_role_name_exception import InvalidRoleNameException

from app.domain.exceptions.user.user_not_found_exception import UserNotFoundException
from app.domain.exceptions.user.player_not_found_exception import PlayerNotFoundException
from app.domain.exceptions.user.invalid_username_exception import InvalidUsernameException
from app.domain.exceptions.user.username_already_exist_exception import UsernameAlreadyExistsException
from app.domain.exceptions.user.unauthotized_exception import UnauthorizedException

from app.domain.exceptions.videogame.videogame_not_found_exception import VideogameNotFoundException
from app.domain.exceptions.videogame.videogame_already_exists_exception import VideogameAlreadyExistsException
from app.domain.exceptions.videogame.invalid_videogame_name_exception import InvalidVideogameNameException


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

    def test_character_exceptions(self):
        nf = CharacterNotFoundException(character_id=42)
        assert nf.status_code == 404
        assert "42" in nf.message

        dup = DuplicatedCharacterNameException(name="Ahri", videogame_id=1)
        assert dup.status_code == 400
        assert "Ahri" in dup.message

        inv = InvalidCharacterNameException(name="")
        assert inv.status_code == 400

    def test_email_exceptions(self):
        dup = EmailAlreadyExistsException(email="test@example.com")
        assert dup.status_code == 409
        assert "test@example.com" in dup.message

        nf = EmailNotFoundException(email="notfound@example.com")
        assert nf.status_code == 404
        assert "notfound@example.com" in nf.message

    def test_game_profile_exceptions(self):
        dup = GameProfileAlreadyExistException(player_id=1, videogame_id=2)
        assert dup.status_code == 400
        assert "1" in dup.message
        assert "2" in dup.message

        nf = GameProfileNotFoundException(game_profile_id=10)
        assert nf.status_code == 404
        assert "10" in nf.message

        not_belong = DoesNotBelongToProfileException(item="perfil de juego", name="10")
        assert not_belong.status_code == 400
        assert "10" in not_belong.message

    def test_user_exceptions(self):
        inv_user = InvalidUsernameException(username="bad name")
        assert inv_user.status_code == 400
        assert "bad name" in inv_user.message

        unf_with_id = UserNotFoundException(user_id=99)
        assert unf_with_id.status_code == 404
        assert "99" in unf_with_id.message

        unf_no_id = UserNotFoundException()
        assert unf_no_id.status_code == 404

        pnf = PlayerNotFoundException(player_id=15)
        assert pnf.status_code == 404
        assert "15" in pnf.message

        dup_user = UsernameAlreadyExistsException(username="existing_user")
        assert dup_user.status_code == 409
        assert "existing_user" in dup_user.message

        unauth = UnauthorizedException(user_id=1, user_role="admin", attempted_role="owner")
        assert unauth.status_code == 401
        assert "admin" in unauth.message

    def test_password_exceptions(self):
        sec = PasswordIsNotSecureException(msg_reason="Demasiado corta")
        assert sec.status_code == 400
        assert "Demasiado corta" in sec.message

        wp = WrongPasswordException(email="test@example.com")
        assert wp.status_code == 401
        assert "test@example.com" in wp.message

    def test_rank_exceptions(self):
        nf = RankNotFoundException(rank_id=5)
        assert nf.status_code == 404
        assert "5" in nf.message

        dup_name = DuplicatedRankNameException(name="Gold")
        assert dup_name.status_code == 409
        assert "Gold" in dup_name.message

        dup_val = DuplicatedRankValueException(value=1000)
        assert dup_val.status_code == 409
        assert "1000" in dup_val.message

        inv_name = InvalidRankNameException(name="")
        assert inv_name.status_code == 400

        inv_val = InvalidRankValueException(value=-1)
        assert inv_val.status_code == 400

    def test_role_exceptions(self):
        nf = RoleNotFoundException(role_id=3)
        assert nf.status_code == 404
        assert "3" in nf.message

        dup = DuplicateRoleNameException(name="Mid")
        assert dup.status_code == 409
        assert "Mid" in dup.message

        inv = InvalidRoleNameException(name="")
        assert inv.status_code == 400

    def test_videogame_exceptions(self):
        nf = VideogameNotFoundException(videogame_id=99)
        assert nf.status_code == 404
        assert "99" in nf.message

        dup = VideogameAlreadyExistsException(videogame_name="LoL")
        assert dup.status_code == 409
        assert "LoL" in dup.message

        inv = InvalidVideogameNameException(name="")
        assert inv.status_code == 400

    def test_miscellaneous_domain_exceptions(self):
        not_belong = DoesNotBelongToGameException(item="personaje", name="Ahri", juego="Dota 2")
        assert not_belong.status_code == 400
        assert "Ahri" in not_belong.message
        assert "Dota 2" in not_belong.message

        fn_null = FileNameNotNullException()
        assert fn_null.status_code == 400

        f_null = FileNotNullException()
        assert f_null.status_code == 400

        inv_fn = InvalidNameFileException(filename="invalid:file.png")
        assert inv_fn.status_code == 400
