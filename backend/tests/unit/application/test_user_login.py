import pytest
from unittest.mock import MagicMock

from app.application.useCases.user_login import UserLogin
from app.application.ports.i_token_service import ITokenService
from app.application.ports.i_password_hasher import IPasswordHasher
from app.domain.models.player import Player
from app.domain.exceptions.mail_not_found_exception import EmailNotFoundException
from app.domain.exceptions.wrong_password_exception import WrongPasswordException
from app.infrastructure.api.dto.login_request import LoginRequest


class TestUserLoginUseCase:

    @pytest.fixture
    def mock_dependencies(self):
        mock_uow = MagicMock()
        mock_uow.__enter__.return_value = mock_uow
        mock_uow.__exit__.return_value = None
        mock_uow.player_repo = MagicMock()

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

        existing_player = Player(
            player_id=10,
            username="johndoe",
            name="John Doe",
            mail="john@example.com",
            password_hash="argon2_hashed_pw",
            profiles=[]
        )
        mock_uow.player_repo.get_player_by_mail.return_value = existing_player
        mock_password_hasher.verify_password.return_value = True
        mock_token_service.generate_tokens.return_value = ("access_token_123", "refresh_token_123")

        request = LoginRequest(mail="john@example.com", password="Password123")
        response = use_case.execute(request)

        assert response.access_token == "access_token_123"
        assert response.refresh_token == "refresh_token_123"
        assert response.token_type == "Bearer"

        mock_uow.player_repo.get_player_by_mail.assert_called_once_with("john@example.com")
        mock_password_hasher.verify_password.assert_called_once_with("Password123", "argon2_hashed_pw")
        mock_token_service.generate_tokens.assert_called_once_with(10)

    def test_login_email_not_found(self, mock_dependencies):
        use_case, mock_uow, _, _ = mock_dependencies

        mock_uow.player_repo.get_player_by_mail.return_value = None

        request = LoginRequest(mail="unknown@example.com", password="Password123")

        with pytest.raises(EmailNotFoundException) as exc_info:
            use_case.execute(request)

        assert "unknown@example.com" in exc_info.value.message
        assert exc_info.value.status_code == 404

    def test_login_wrong_password(self, mock_dependencies):
        use_case, mock_uow, _, mock_password_hasher = mock_dependencies

        existing_player = Player(
            player_id=10,
            username="johndoe",
            name="John Doe",
            mail="john@example.com",
            password_hash="argon2_hashed_pw",
            profiles=[]
        )
        mock_uow.player_repo.get_player_by_mail.return_value = existing_player
        mock_password_hasher.verify_password.return_value = False

        request = LoginRequest(mail="john@example.com", password="WrongPassword123")

        with pytest.raises(WrongPasswordException) as exc_info:
            use_case.execute(request)

        assert "john@example.com" in exc_info.value.message
        assert exc_info.value.status_code == 401
