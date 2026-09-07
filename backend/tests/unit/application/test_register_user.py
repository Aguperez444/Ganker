from datetime import datetime, timezone
import pytest
from unittest.mock import MagicMock

from app.application.useCases.register_user import RegisterUser
from app.application.ports.i_token_service import ITokenService
from app.application.ports.i_password_hasher import IPasswordHasher
from app.domain.models.user import User
from app.domain.models.user_role import UserRole
from app.domain.exceptions.mail.email_already_exists_exception import EmailAlreadyExistsException
from app.domain.exceptions.user.invalid_username_exception import InvalidUsernameException
from app.domain.exceptions.auth.password_is_not_secure_exception import PasswordIsNotSecureException
from app.domain.exceptions.user.username_already_exist_exception import UsernameAlreadyExistsException
from app.domain.exceptions.user.user_not_found_exception import UserNotFoundException
from app.domain.exceptions.user.unauthotized_exception import UnauthorizedException
from app.infrastructure.api.dto.request.register_user_request import RegisterUserRequest


class TestRegisterUserUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.user_repo = MagicMock()
        uow.refresh_token_repo = MagicMock()

        token_service = MagicMock(spec=ITokenService)
        password_hasher = MagicMock(spec=IPasswordHasher)

        use_case = RegisterUser(unit_of_work=uow, token_service=token_service, password_hasher=password_hasher)
        return use_case, uow, token_service, password_hasher

    def test_register_user_by_owner_happy_path(self, mock_deps):
        use_case, uow, token_service, password_hasher = mock_deps

        uow.user_repo.get_user_by_mail.return_value = None
        uow.user_repo.get_user_by_username.return_value = None
        current_owner = User(user_id=1, username="owner", name="Owner", mail="owner@ex.com", password_hash="hash", role=UserRole.OWNER, profiles=[])
        uow.user_repo.get_user_by_id.return_value = current_owner
        password_hasher.hash_password.return_value = "hashed_pw"

        created_admin = User(user_id=2, username="newadmin", name="New Admin", mail="newadmin@ex.com", password_hash="hashed_pw", role=UserRole.ADMIN, profiles=[])
        uow.user_repo.create_user.return_value = created_admin
        token_service.generate_tokens.return_value = ("access", "refresh", "jti-1", datetime.now(timezone.utc))

        req = RegisterUserRequest(
            name="New Admin",
            username="newadmin",
            mail="newadmin@ex.com",
            password="Password123",
            role=UserRole.ADMIN
        )

        res = use_case.execute(req, current_user_id=1)

        assert res.user_id == 2
        assert res.username == "newadmin"
        assert res.role == UserRole.ADMIN

    def test_admin_cannot_create_owner_raises_unauthorized(self, mock_deps):
        use_case, uow, _, _ = mock_deps

        uow.user_repo.get_user_by_mail.return_value = None
        uow.user_repo.get_user_by_username.return_value = None
        current_admin = User(user_id=1, username="admin", name="Admin", mail="admin@ex.com", password_hash="hash", role=UserRole.ADMIN, profiles=[])
        uow.user_repo.get_user_by_id.return_value = current_admin

        req = RegisterUserRequest(
            name="Target Owner",
            username="targetowner",
            mail="owner2@ex.com",
            password="Password123",
            role=UserRole.OWNER
        )

        with pytest.raises(UnauthorizedException) as exc_info:
            use_case.execute(req, current_user_id=1)

        assert exc_info.value.status_code == 401

    def test_current_user_not_found_raises_user_not_found(self, mock_deps):
        use_case, uow, _, _ = mock_deps

        uow.user_repo.get_user_by_mail.return_value = None
        uow.user_repo.get_user_by_username.return_value = None
        uow.user_repo.get_user_by_id.return_value = None

        req = RegisterUserRequest(
            name="User",
            username="username",
            mail="mail@ex.com",
            password="Password123",
            role=UserRole.PLAYER
        )

        with pytest.raises(UserNotFoundException) as exc_info:
            use_case.execute(req, current_user_id=999)

        assert exc_info.value.status_code == 404

    def test_duplicate_email_raises_conflict(self, mock_deps):
        use_case, uow, _, _ = mock_deps

        existing = User(2, "ex", "Ex", "dup@ex.com", "hash", UserRole.PLAYER, [])
        uow.user_repo.get_user_by_mail.return_value = existing

        req = RegisterUserRequest(name="A", username="a", mail="dup@ex.com", password="Password123", role=UserRole.PLAYER)

        with pytest.raises(EmailAlreadyExistsException) as exc_info:
            use_case.execute(req, current_user_id=1)

        assert exc_info.value.status_code == 409

    def test_duplicate_username_raises_conflict(self, mock_deps):
        use_case, uow, _, _ = mock_deps

        uow.user_repo.get_user_by_mail.return_value = None
        existing = User(2, "dupuser", "Ex", "a@ex.com", "hash", UserRole.PLAYER, [])
        uow.user_repo.get_user_by_username.return_value = existing

        req = RegisterUserRequest(name="A", username="dupuser", mail="other@ex.com", password="Password123", role=UserRole.PLAYER)

        with pytest.raises(UsernameAlreadyExistsException) as exc_info:
            use_case.execute(req, current_user_id=1)

        assert exc_info.value.status_code == 409

    def test_insecure_password_raises_bad_request(self, mock_deps):
        use_case, uow, _, _ = mock_deps

        uow.user_repo.get_user_by_mail.return_value = None
        uow.user_repo.get_user_by_username.return_value = None

        req = RegisterUserRequest(name="A", username="user", mail="a@ex.com", password="weak", role=UserRole.PLAYER)

        with pytest.raises(PasswordIsNotSecureException) as exc_info:
            use_case.execute(req, current_user_id=1)

        assert exc_info.value.status_code == 400

    def test_empty_username_raises_bad_request(self, mock_deps):
        use_case, _, _, _ = mock_deps

        with pytest.raises(InvalidUsernameException):
            use_case.validate_username("  ")
