import pytest
from unittest.mock import MagicMock

from app.application.useCases.query_users import QueryUsers
from app.domain.models.user import User
from app.domain.models.user_role import UserRole
from app.domain.exceptions.user.user_not_found_exception import UserNotFoundException


class TestQueryUsersUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.user_repo = MagicMock()

        use_case = QueryUsers(unit_of_work=uow)
        return use_case, uow

    def test_get_by_id_happy_path(self, mock_deps):
        use_case, uow = mock_deps

        user = User(
            user_id=1,
            username="gamer1",
            name="Gamer One",
            mail="gamer1@example.com",
            password_hash="hash",
            role=UserRole.PLAYER,
            profiles=[],
            icon_url="/media/custom_icon.png"
        )
        uow.user_repo.get_user_by_id.return_value = user

        result = use_case.get_by_id(1)

        assert result.username == "gamer1"
        assert result.name == "Gamer One"
        assert result.mail == "gamer1@example.com"
        assert result.role == UserRole.PLAYER
        assert result.icon_url == "/media/custom_icon.png"
        assert result.profiles == []

    def test_get_by_id_default_icon_when_none(self, mock_deps):
        use_case, uow = mock_deps

        user = User(
            user_id=2,
            username="gamer2",
            name="Gamer Two",
            mail="gamer2@example.com",
            password_hash="hash",
            role=UserRole.PLAYER,
            profiles=[],
            icon_url=None
        )
        uow.user_repo.get_user_by_id.return_value = user

        result = use_case.get_by_id(2)

        assert result.icon_url == "/media/users/icons/icon_example_1.png"

    def test_get_by_id_not_found_raises_exception(self, mock_deps):
        use_case, uow = mock_deps

        uow.user_repo.get_user_by_id.return_value = None

        with pytest.raises(UserNotFoundException) as exc_info:
            use_case.get_by_id(999)

        assert exc_info.value.status_code == 404
        assert "999" in exc_info.value.message
