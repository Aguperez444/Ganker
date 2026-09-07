import pytest
from unittest.mock import MagicMock

from app.application.useCases.user_logout import UserLogout
from app.application.ports.i_token_service import ITokenService
from app.domain.exceptions.Invalid_token_exception import InvalidTokenException


class TestUserLogoutUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.refresh_token_repo = MagicMock()

        token_service = MagicMock(spec=ITokenService)
        use_case = UserLogout(ouw=uow, token_service=token_service)
        return use_case, uow, token_service

    def test_logout_happy_path(self, mock_deps):
        use_case, uow, token_service = mock_deps

        token_service.verify_refresh_token.return_value = {"user_id": 1, "jti": "active-jti"}
        uow.refresh_token_repo.revoke_by_jti.return_value = True

        use_case.execute("valid_refresh_token")

        token_service.verify_refresh_token.assert_called_once_with("valid_refresh_token")
        uow.refresh_token_repo.revoke_by_jti.assert_called_once_with("active-jti")

    def test_logout_already_revoked_token_raises_invalid_token(self, mock_deps):
        use_case, uow, token_service = mock_deps

        token_service.verify_refresh_token.return_value = {"user_id": 1, "jti": "already-revoked-jti"}
        uow.refresh_token_repo.revoke_by_jti.return_value = False

        with pytest.raises(InvalidTokenException) as exc_info:
            use_case.execute("revoked_refresh_token")

        assert "Token revoked" in exc_info.value.message
        assert exc_info.value.status_code == 401

    def test_logout_invalid_refresh_token_raises_invalid_token(self, mock_deps):
        use_case, _, token_service = mock_deps

        token_service.verify_refresh_token.side_effect = InvalidTokenException("Token inválido")

        with pytest.raises(InvalidTokenException):
            use_case.execute("invalid_token")
