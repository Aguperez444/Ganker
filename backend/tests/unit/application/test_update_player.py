from unittest.mock import AsyncMock, MagicMock
import pytest

from app.application.useCases.update_user import UpdateUser
from app.application.ports.i_storage_service import IStorageService
from app.domain.models.user import User
from app.domain.models.user_role import UserRole
from app.domain.exceptions.user.username_already_exists_exception import UsernameAlreadyExistsException
from app.domain.exceptions.mail.email_already_exists_exception import EmailAlreadyExistsException
from app.domain.exceptions.user.user_not_found_exception import UserNotFoundException


class TestUpdateUserUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.user_repo = MagicMock()

        storage_service = MagicMock(spec=IStorageService)
        storage_service.delete_file = AsyncMock(return_value=True)
        storage_service.save_file = AsyncMock(return_value="/media/users/icons/new_icon.png")

        use_case = UpdateUser(unit_of_work=uow, storage_service=storage_service)
        return use_case, uow, storage_service

    @pytest.mark.anyio
    async def test_update_user_happy_path_with_new_icon(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        existing_user = User(
            user_id=1,
            username="olduser",
            name="Old Name",
            mail="old@example.com",
            password_hash="hash",
            role=UserRole.PLAYER,
            profiles=[],
            icon_url="/media/users/icons/old_icon.png"
        )
        uow.user_repo.get_user_by_username.return_value = existing_user  # same user
        uow.user_repo.get_user_by_mail.return_value = existing_user      # same user
        uow.user_repo.get_user_by_id.return_value = existing_user
        uow.user_repo.update_user.side_effect = lambda u: u

        mock_icon = MagicMock()
        mock_icon.filename = "new_avatar.png"
        mock_icon.file = MagicMock()

        updated = await use_case.execute(
            user_id=1,
            username="newuser",
            name="New Name",
            mail="new@example.com",
            icon=mock_icon
        )

        assert updated.username == "newuser"
        assert updated.name == "New Name"
        assert updated.mail == "new@example.com"
        assert updated.icon_url == "/media/users/icons/new_icon.png"

        # Deleted old icon and saved new icon
        storage_service.delete_file.assert_called_once_with("/media/users/icons/old_icon.png")
        storage_service.save_file.assert_called_once()
        uow.user_repo.update_user.assert_called_once()

    @pytest.mark.anyio
    async def test_update_user_username_taken_by_another_user(self, mock_deps):
        use_case, uow, _ = mock_deps

        another_user = User(user_id=99, username="taken_name", name="Other", mail="other@example.com", password_hash="hash", role=UserRole.PLAYER, profiles=[])
        uow.user_repo.get_user_by_username.return_value = another_user

        with pytest.raises(UsernameAlreadyExistsException) as exc_info:
            await use_case.execute(user_id=1, username="taken_name", name="Name", mail="mail@example.com", icon=MagicMock())

        assert exc_info.value.status_code == 409
        assert "taken_name" in exc_info.value.message

    @pytest.mark.anyio
    async def test_update_user_mail_taken_by_another_user(self, mock_deps):
        use_case, uow, _ = mock_deps

        uow.user_repo.get_user_by_username.return_value = None
        another_user = User(user_id=99, username="other", name="Other", mail="taken@example.com", password_hash="hash", role=UserRole.PLAYER, profiles=[])
        uow.user_repo.get_user_by_mail.return_value = another_user

        with pytest.raises(EmailAlreadyExistsException) as exc_info:
            await use_case.execute(user_id=1, username="newname", name="Name", mail="taken@example.com", icon=MagicMock())

        assert exc_info.value.status_code == 409
        assert "taken@example.com" in exc_info.value.message

    @pytest.mark.anyio
    async def test_update_user_not_found(self, mock_deps):
        use_case, uow, _ = mock_deps

        uow.user_repo.get_user_by_username.return_value = None
        uow.user_repo.get_user_by_mail.return_value = None
        uow.user_repo.get_user_by_id.return_value = None

        with pytest.raises(UserNotFoundException) as exc_info:
            await use_case.execute(user_id=404, username="user", name="Name", mail="mail@example.com", icon=MagicMock())

        assert exc_info.value.status_code == 404

    @pytest.mark.anyio
    async def test_update_user_db_error_cleans_up_uploaded_file(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        existing_user = User(
            user_id=1,
            username="olduser",
            name="Old Name",
            mail="old@example.com",
            password_hash="hash",
            role=UserRole.PLAYER,
            profiles=[],
            icon_url=None
        )
        uow.user_repo.get_user_by_username.return_value = None
        uow.user_repo.get_user_by_mail.return_value = None
        uow.user_repo.get_user_by_id.return_value = existing_user
        uow.user_repo.update_user.side_effect = RuntimeError("DB connection failure")

        mock_icon = MagicMock()
        mock_icon.filename = "new_avatar.png"
        mock_icon.file = MagicMock()

        with pytest.raises(Exception):
            await use_case.execute(
                user_id=1,
                username="newuser",
                name="New Name",
                mail="new@example.com",
                icon=mock_icon
            )

        # File was uploaded then cleaned up on DB failure
        storage_service.delete_file.assert_called_with("/media/users/icons/new_icon.png")
