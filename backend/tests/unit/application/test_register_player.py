from datetime import datetime, timezone
import pytest
from unittest.mock import MagicMock

from app.application.useCases.register_player import RegisterPlayer
from app.application.ports.i_token_service import ITokenService
from app.application.ports.i_password_hasher import IPasswordHasher
from app.domain.models.user import User
from app.domain.models.user_role import UserRole
from app.domain.exceptions.mail.email_already_exists_exception import EmailAlreadyExistsException
from app.domain.exceptions.user.invalid_username_exception import InvalidUsernameException
from exceptions.auth.password_is_not_secure_exception import PasswordIsNotSecureException
from app.domain.exceptions.user.username_already_exist_exception import UsernameAlreadyExistsException
from app.infrastructure.api.dto.request.register_player_request import RegisterPlayerRequest


class TestRegisterPlayerUseCase:

    @pytest.fixture
    def mock_dependencies(self):
        mock_uow = MagicMock()
        mock_uow.__enter__.return_value = mock_uow
        mock_uow.__exit__.return_value = None
        mock_uow.user_repo = MagicMock()
        mock_uow.refresh_token_repo = MagicMock()

        mock_token_service = MagicMock(spec=ITokenService)
        mock_password_hasher = MagicMock(spec=IPasswordHasher)

        use_case = RegisterPlayer(
            unit_of_work=mock_uow,
            token_service=mock_token_service,
            password_hasher=mock_password_hasher
        )
        return use_case, mock_uow, mock_token_service, mock_password_hasher

    def test_register_player_happy_path(self, mock_dependencies):
        use_case, mock_uow, mock_token_service, mock_password_hasher = mock_dependencies

        mock_uow.user_repo.get_user_by_mail.return_value = None
        mock_uow.user_repo.get_user_by_username.return_value = None
        mock_password_hasher.hash_password.return_value = "argon2_hashed_pw"

        saved_user = User(
            user_id=1,
            username="johndoe",
            name="John Doe",
            mail="john@example.com",
            password_hash="argon2_hashed_pw",
            role=UserRole.PLAYER,
            profiles=[]
        )
        mock_uow.user_repo.create_user.return_value = saved_user
        fake_expires_at = datetime.now(timezone.utc)
        mock_token_service.generate_tokens.return_value = ("fake_access_token", "fake_refresh_token", "fake-jti", fake_expires_at)

        request = RegisterPlayerRequest(
            name="John Doe",
            username="johndoe",
            mail="john@example.com",
            password="SecurePassword123"
        )

        response = use_case.execute(request)

        assert response.access_token == "fake_access_token"
        assert response.refresh_token == "fake_refresh_token"
        assert response.token_type == "Bearer"

        mock_password_hasher.hash_password.assert_called_once_with("SecurePassword123")
        mock_uow.user_repo.create_user.assert_called_once()
        mock_token_service.generate_tokens.assert_called_once_with(user_id=1, role=UserRole.PLAYER)
        mock_uow.refresh_token_repo.save.assert_called_once_with(
            user_id=1,
            role=UserRole.PLAYER,
            jti="fake-jti",
            expires_at=fake_expires_at
        )

    def test_register_player_email_already_exists(self, mock_dependencies):
        use_case, mock_uow, _, _ = mock_dependencies

        existing_user = User(1, "existing", "Existing", "john@example.com", "hash", UserRole.PLAYER, [])
        mock_uow.user_repo.get_user_by_mail.return_value = existing_user

        request = RegisterPlayerRequest(
            name="John Doe",
            username="johndoe",
            mail="john@example.com",
            password="SecurePassword123"
        )

        with pytest.raises(EmailAlreadyExistsException) as exc_info:
            use_case.execute(request)

        assert "john@example.com" in exc_info.value.message
        assert exc_info.value.status_code == 409

    def test_register_player_username_already_exists(self, mock_dependencies):
        use_case, mock_uow, _, _ = mock_dependencies

        mock_uow.user_repo.get_user_by_mail.return_value = None
        existing_user = User(2, "johndoe", "Existing", "other@example.com", "hash", UserRole.PLAYER, [])
        mock_uow.user_repo.get_user_by_username.return_value = existing_user

        request = RegisterPlayerRequest(
            name="John Doe",
            username="johndoe",
            mail="john@example.com",
            password="SecurePassword123"
        )

        with pytest.raises(UsernameAlreadyExistsException) as exc_info:
            use_case.execute(request)

        assert "johndoe" in exc_info.value.message
        assert exc_info.value.status_code == 409

    @pytest.mark.parametrize("empty_username", ["", "   ", None])
    def test_register_player_invalid_empty_username(self, mock_dependencies, empty_username):
        use_case, mock_uow, _, _ = mock_dependencies
        mock_uow.user_repo.get_user_by_mail.return_value = None

        with pytest.raises(InvalidUsernameException) as exc_info:
            use_case.validate_username(empty_username)

        assert exc_info.value.status_code == 400

    @pytest.mark.parametrize("bad_password, expected_msg", [
        ("Short1A", "Debe tener al menos 8 caracteres"),
        ("lowercaseandnumbers123", "Debe contener al menos una letra mayúscula"),
        ("UPPERCASEANDNUMBERS123", "Debe contener al menos una letra minúscula"),
        ("NoNumbersAtAllPassword", "Debe contener al menos un número"),
    ])
    def test_register_player_insecure_passwords(self, mock_dependencies, bad_password, expected_msg):
        use_case, mock_uow, _, _ = mock_dependencies
        mock_uow.user_repo.get_user_by_mail.return_value = None
        mock_uow.user_repo.get_user_by_username.return_value = None

        request = RegisterPlayerRequest(
            name="John Doe",
            username="johndoe",
            mail="john@example.com",
            password=bad_password
        )

        with pytest.raises(PasswordIsNotSecureException) as exc_info:
            use_case.execute(request)

        assert expected_msg in exc_info.value.message
        assert exc_info.value.status_code == 400
