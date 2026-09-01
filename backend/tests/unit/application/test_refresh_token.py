import pytest
from unittest.mock import MagicMock

from app.application.useCases.refresh_token import RefreshToken
from app.application.ports.i_token_service import ITokenService
from app.domain.models.player import Player
from app.domain.exceptions.user_not_found_exception import UserNotFoundException
from app.domain.exceptions.Invalid_token_exception import InvalidTokenException


class TestRefreshTokenUseCase:

    @pytest.fixture
    def mock_dependencies(self):
        mock_uow = MagicMock()
        mock_uow.__enter__.return_value = mock_uow
        mock_uow.__exit__.return_value = None
        mock_uow.player_repo = MagicMock()

        mock_token_service = MagicMock(spec=ITokenService)

        use_case = RefreshToken(
            uow=mock_uow,
            token_service=mock_token_service
        )
        return use_case, mock_uow, mock_token_service

    def test_refresh_token_happy_path(self, mock_dependencies):
        use_case, mock_uow, mock_token_service = mock_dependencies

        mock_token_service.verify_refresh_token.return_value = 5
        existing_player = Player(
            player_id=5,
            username="johndoe",
            name="John Doe",
            mail="john@example.com",
            password_hash="hash",
            profiles=[]
        )
        mock_uow.player_repo.get_player_by_id.return_value = existing_player
        mock_token_service.generate_tokens.return_value = ("new_access_token", "new_refresh_token")

        response = use_case.execute("valid_refresh_token_str")

        assert response.access_token == "new_access_token"
        assert response.refresh_token == "new_refresh_token"
        assert response.token_type == "Bearer"

        mock_token_service.verify_refresh_token.assert_called_once_with("valid_refresh_token_str")
        mock_uow.player_repo.get_player_by_id.assert_called_once_with(5)
        mock_token_service.generate_tokens.assert_called_once_with(5)

    def test_refresh_token_user_not_found_in_db(self, mock_dependencies):
        use_case, mock_uow, mock_token_service = mock_dependencies

        mock_token_service.verify_refresh_token.return_value = 999
        mock_uow.player_repo.get_player_by_id.return_value = None

        with pytest.raises(UserNotFoundException) as exc_info:
            use_case.execute("valid_refresh_token_str")

        assert exc_info.value.status_code == 404

    def test_refresh_token_invalid_token(self, mock_dependencies):
        use_case, _, mock_token_service = mock_dependencies

        mock_token_service.verify_refresh_token.side_effect = InvalidTokenException("Token inválido: no es un refresh token")

        with pytest.raises(InvalidTokenException) as exc_info:
            use_case.execute("invalid_token_str")

        assert exc_info.value.status_code == 401
