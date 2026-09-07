import pytest
from sqlalchemy.exc import IntegrityError
from app.domain.models.user import User
from app.domain.models.user_role import UserRole
from app.infrastructure.database.repositories.user_repository_impl import UserRepositoryImpl


class TestUserRepositoryIntegration:

    def test_create_and_get_user_by_id(self, test_db_session):
        repo = UserRepositoryImpl(test_db_session)
        user = User(
            user_id=None,
            username="gamer1",
            name="Gamer One",
            mail="gamer1@example.com",
            password_hash="hashed_pw_123",
            role=UserRole.PLAYER,
            profiles=[]
        )

        created = repo.create_user(user)
        test_db_session.commit()

        assert created.user_id is not None
        assert created.username == "gamer1"

        retrieved = repo.get_user_by_id(created.user_id)
        assert retrieved is not None
        assert retrieved.username == "gamer1"
        assert retrieved.mail == "gamer1@example.com"
        assert retrieved.role == UserRole.PLAYER

    def test_get_user_by_mail(self, test_db_session):
        repo = UserRepositoryImpl(test_db_session)
        user = User(None, "gamer2", "Gamer Two", "gamer2@example.com", "hash", UserRole.PLAYER, [])
        repo.create_user(user)
        test_db_session.commit()

        found = repo.get_user_by_mail("gamer2@example.com")
        assert found is not None
        assert found.username == "gamer2"

        not_found = repo.get_user_by_mail("nonexistent@example.com")
        assert not_found is None

    def test_get_user_by_username(self, test_db_session):
        repo = UserRepositoryImpl(test_db_session)
        user = User(None, "gamer3", "Gamer Three", "gamer3@example.com", "hash", UserRole.PLAYER, [])
        repo.create_user(user)
        test_db_session.commit()

        found = repo.get_user_by_username("gamer3")
        assert found is not None
        assert found.mail == "gamer3@example.com"

        not_found = repo.get_user_by_username("unknown_user")
        assert not_found is None

    def test_update_user(self, test_db_session):
        repo = UserRepositoryImpl(test_db_session)
        user = User(None, "original_user", "Original", "orig@example.com", "hash", UserRole.PLAYER, [], "/orig.png")
        saved = repo.create_user(user)
        test_db_session.commit()

        saved.name = "Updated Name"
        saved.username = "updated_user"
        saved.mail = "updated@example.com"
        saved.icon_url = "/new_icon.png"

        updated = repo.update_user(saved)
        test_db_session.commit()

        assert updated.name == "Updated Name"
        assert updated.username == "updated_user"
        assert updated.mail == "updated@example.com"
        assert updated.icon_url == "/new_icon.png"

    def test_unique_username_constraint(self, test_db_session):
        repo = UserRepositoryImpl(test_db_session)
        u1 = User(None, "duplicate_user", "One", "user1@example.com", "hash", UserRole.PLAYER, [])
        u2 = User(None, "duplicate_user", "Two", "user2@example.com", "hash", UserRole.PLAYER, [])

        repo.create_user(u1)
        test_db_session.commit()

        with pytest.raises(IntegrityError):
            repo.create_user(u2)
        test_db_session.rollback()

    def test_unique_mail_constraint(self, test_db_session):
        repo = UserRepositoryImpl(test_db_session)
        u1 = User(None, "user_a", "One", "same_mail@example.com", "hash", UserRole.PLAYER, [])
        u2 = User(None, "user_b", "Two", "same_mail@example.com", "hash", UserRole.PLAYER, [])

        repo.create_user(u1)
        test_db_session.commit()

        with pytest.raises(IntegrityError):
            repo.create_user(u2)
        test_db_session.rollback()
