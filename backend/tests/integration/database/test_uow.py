import pytest
from app.domain.models.user import User
from app.domain.models.user_role import UserRole
from app.infrastructure.database.models.user_orm import UserORM


class TestUnitOfWorkIntegration:

    def test_uow_commits_on_clean_exit(self, test_uow, test_session_factory):
        # 1. Create a user inside UoW block
        user_domain = User(
            user_id=None,
            username="committed_user",
            name="Committed User",
            mail="committed@example.com",
            password_hash="hash123",
            role=UserRole.PLAYER,
            profiles=[]
        )

        with test_uow:
            created = test_uow.user_repo.create_user(user_domain)
            assert created.user_id is not None
            created_id = created.user_id

        # 2. Open a separate session to verify data was committed
        with test_session_factory() as session:
            found = session.query(UserORM).filter(UserORM.user_id == created_id).first()
            assert found is not None
            assert found.username == "committed_user"

    def test_uow_rollbacks_on_exception(self, test_uow, test_session_factory):
        user_domain = User(
            user_id=None,
            username="rollback_user",
            name="Rollback User",
            mail="rollback@example.com",
            password_hash="hash123",
            role=UserRole.PLAYER,
            profiles=[]
        )

        with pytest.raises(RuntimeError):
            with test_uow:
                test_uow.user_repo.create_user(user_domain)
                raise RuntimeError("Simulated failure inside transaction")

        # Verify nothing was persisted
        with test_session_factory() as session:
            found = session.query(UserORM).filter(UserORM.username == "rollback_user").first()
            assert found is None

    def test_uow_explicit_commit_and_rollback(self, test_uow, test_session_factory):
        user1 = User(None, "explicit_commit", "Explicit", "exp_com@example.com", "hash", UserRole.PLAYER, [])
        user2 = User(None, "explicit_rollback", "Explicit", "exp_rb@example.com", "hash", UserRole.PLAYER, [])

        with test_uow:
            test_uow.user_repo.create_user(user1)
            test_uow.commit()

            test_uow.user_repo.create_user(user2)
            test_uow.rollback()

        with test_session_factory() as session:
            p1 = session.query(UserORM).filter(UserORM.username == "explicit_commit").first()
            p2 = session.query(UserORM).filter(UserORM.username == "explicit_rollback").first()
            assert p1 is not None
            assert p2 is None
