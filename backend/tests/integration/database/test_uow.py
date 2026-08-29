import pytest
from sqlalchemy import text
from app.domain.models.player import Player
from app.infrastructure.database.models.player_orm import PlayerORM


class TestUnitOfWorkIntegration:

    def test_uow_commits_on_clean_exit(self, test_uow, test_session_factory):
        # 1. Create a player inside UoW block
        player_domain = Player(
            player_id=None,
            username="committed_user",
            name="Committed User",
            mail="committed@example.com",
            password_hash="hash123",
            profiles=[]
        )

        with test_uow:
            created = test_uow.player_repo.create_player(player_domain)
            assert created.player_id is not None
            created_id = created.player_id

        # 2. Open a separate session to verify data was committed
        with test_session_factory() as session:
            found = session.query(PlayerORM).filter(PlayerORM.player_id == created_id).first()
            assert found is not None
            assert found.username == "committed_user"

    def test_uow_rollbacks_on_exception(self, test_uow, test_session_factory):
        player_domain = Player(
            player_id=None,
            username="rollback_user",
            name="Rollback User",
            mail="rollback@example.com",
            password_hash="hash123",
            profiles=[]
        )

        with pytest.raises(RuntimeError):
            with test_uow:
                test_uow.player_repo.create_player(player_domain)
                raise RuntimeError("Simulated failure inside transaction")

        # Verify nothing was persisted
        with test_session_factory() as session:
            found = session.query(PlayerORM).filter(PlayerORM.username == "rollback_user").first()
            assert found is None

    def test_uow_explicit_commit_and_rollback(self, test_uow, test_session_factory):
        player1 = Player(None, "explicit_commit", "Explicit", "exp_com@example.com", "hash", [])
        player2 = Player(None, "explicit_rollback", "Explicit", "exp_rb@example.com", "hash", [])

        with test_uow:
            test_uow.player_repo.create_player(player1)
            test_uow.commit()

            test_uow.player_repo.create_player(player2)
            test_uow.rollback()

        with test_session_factory() as session:
            p1 = session.query(PlayerORM).filter(PlayerORM.username == "explicit_commit").first()
            p2 = session.query(PlayerORM).filter(PlayerORM.username == "explicit_rollback").first()
            assert p1 is not None
            assert p2 is None
