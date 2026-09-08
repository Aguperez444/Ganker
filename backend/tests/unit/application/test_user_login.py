from datetime import datetime, timezone
import pytest
from unittest.mock import MagicMock

from app.application.use_cases.user_login import UserLogin
from app.application.ports.i_token_service import ITokenService
from app.application.ports.i_password_hasher import IPasswordHasher
from app.domain.models.user import User
from app.domain.models.user_role import UserRole
from app.domain.exceptions.mail.mail_not_found_exception import EmailNotFoundException
from app.domain.exceptions.auth.wrong_password_exception import WrongPasswordException
from app.infrastructure.api.dto.request.login_request import LoginRequest


class TestUserLoginUseCase:

    @pytest.fixture
    def mock_dependencies(self):
        mock_uow = MagicMock()
        mock_uow.__enter__.return_value = mock_uow
        mock_uow.__exit__.return_value = None
        mock_uow.user_repo = MagicMock()
        mock_uow.refresh_token_repo = MagicMock()

        mock_token_service = MagicMock(spec=ITokenService)
        mock_password_hasher = MagicMock(spec=IPasswordHasher)

        use_case = UserLogin(
            uow=mock_uow,
            token_service=mock_token_service,
            password_hasher=mock_password_hasher
        )
        return use_case, mock_uow, mock_token_service, mock_password_hasher

    def test_login_happy_path(self, mock_dependencies):
        use_case, mock_uow, mock_token_service, mock_password_hasher = mock_dependencies

        existing_user = User(
            user_id=10,
            username="johndoe",
            name="John Doe",
            mail="john@example.com",
            password_hash="argon2_hashed_pw",
            role=UserRole.PLAYER,
            profiles=[]
        )
        mock_uow.user_repo.get_user_by_mail.return_value = existing_user
        mock_password_hasher.verify_password.return_value = True
        fake_expires_at = datetime.now(timezone.utc)
        mock_token_service.generate_tokens.return_value = ("access_token_123", "refresh_token_123", "fake-jti-1", fake_expires_at)

        request = LoginRequest(mail="john@example.com", password="Password123")
        response = use_case.execute(request)

        assert response.access_token == "access_token_123"
        assert response.refresh_token == "refresh_token_123"
        assert response.token_type == "Bearer"

        mock_uow.user_repo.get_user_by_mail.assert_called_once_with("john@example.com")
        mock_password_hasher.verify_password.assert_called_once_with("Password123", "argon2_hashed_pw")
        mock_token_service.generate_tokens.assert_called_once_with(user_id=10, role=UserRole.PLAYER)
        mock_uow.refresh_token_repo.save.assert_called_once_with(
            user_id=10,
            role=UserRole.PLAYER,
            jti="fake-jti-1",
            expires_at=fake_expires_at
        )

    def test_login_email_not_found(self, mock_dependencies):
        use_case, mock_uow, _, _ = mock_dependencies

        mock_uow.user_repo.get_user_by_mail.return_value = None

        request = LoginRequest(mail="unknown@example.com", password="Password123")

        with pytest.raises(EmailNotFoundException) as exc_info:
            use_case.execute(request)

        assert "unknown@example.com" in exc_info.value.message
        assert exc_info.value.status_code == 404

    def test_login_wrong_password(self, mock_dependencies):
        use_case, mock_uow, _, mock_password_hasher = mock_dependencies

        existing_user = User(
            user_id=10,
            username="johndoe",
            name="John Doe",
            mail="john@example.com",
            password_hash="argon2_hashed_pw",
            role=UserRole.PLAYER,
            profiles=[]
        )
        mock_uow.user_repo.get_user_by_mail.return_value = existing_user
        mock_password_hasher.verify_password.return_value = False

        request = LoginRequest(mail="john@example.com", password="WrongPassword123")

        with pytest.raises(WrongPasswordException) as exc_info:
            use_case.execute(request)

        assert "john@example.com" in exc_info.value.message
        assert exc_info.value.status_code == 401
