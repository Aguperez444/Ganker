import pytest
from sqlalchemy.exc import IntegrityError
from app.domain.models.player import Player
from app.infrastructure.database.repositories.player_repository_impl import PlayerRepositoryImpl


class TestPlayerRepositoryIntegration:

    def test_create_and_get_player_by_id(self, test_db_session):
        repo = PlayerRepositoryImpl(test_db_session)
        player = Player(
            player_id=None,
            username="gamer1",
            name="Gamer One",
            mail="gamer1@example.com",
            password_hash="hashed_pw_123",
            profiles=[]
        )

        created = repo.create_player(player)
        test_db_session.commit()

        assert created.player_id is not None
        assert created.username == "gamer1"

        retrieved = repo.get_player_by_id(created.player_id)
        assert retrieved is not None
        assert retrieved.username == "gamer1"
        assert retrieved.mail == "gamer1@example.com"

    def test_get_player_by_mail(self, test_db_session):
        repo = PlayerRepositoryImpl(test_db_session)
        player = Player(None, "gamer2", "Gamer Two", "gamer2@example.com", "hash", [])
        repo.create_player(player)
        test_db_session.commit()

        found = repo.get_player_by_mail("gamer2@example.com")
        assert found is not None
        assert found.username == "gamer2"

        not_found = repo.get_player_by_mail("nonexistent@example.com")
        assert not_found is None

    def test_get_player_by_username(self, test_db_session):
        repo = PlayerRepositoryImpl(test_db_session)
        player = Player(None, "gamer3", "Gamer Three", "gamer3@example.com", "hash", [])
        repo.create_player(player)
        test_db_session.commit()

        found = repo.get_player_by_username("gamer3")
        assert found is not None
        assert found.mail == "gamer3@example.com"

        not_found = repo.get_player_by_username("unknown_user")
        assert not_found is None

    def test_unique_username_constraint(self, test_db_session):
        repo = PlayerRepositoryImpl(test_db_session)
        p1 = Player(None, "duplicate_user", "One", "user1@example.com", "hash", [])
        p2 = Player(None, "duplicate_user", "Two", "user2@example.com", "hash", [])

        repo.create_player(p1)
        test_db_session.commit()

        with pytest.raises(IntegrityError):
            repo.create_player(p2)
        test_db_session.rollback()

    def test_unique_mail_constraint(self, test_db_session):
        repo = PlayerRepositoryImpl(test_db_session)
        p1 = Player(None, "user_a", "One", "same_mail@example.com", "hash", [])
        p2 = Player(None, "user_b", "Two", "same_mail@example.com", "hash", [])

        repo.create_player(p1)
        test_db_session.commit()

        with pytest.raises(IntegrityError):
            repo.create_player(p2)
        test_db_session.rollback()

