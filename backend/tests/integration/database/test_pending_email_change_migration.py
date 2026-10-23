import importlib.util
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.domain.models.pending_email_change import PendingEmailChange
from app.infrastructure.database.models.pending_email_change_orm import PendingEmailChangeORM
from app.infrastructure.database.repositories.pending_email_change_repository_impl import PendingEmailChangeRepositoryImpl


def test_migrated_schema_supports_email_change_repository_and_downgrade(monkeypatch):
    path = Path(__file__).parents[3] / "migrations/versions/f8c0e3a5b714_added_pending_email_changes.py"
    spec = importlib.util.spec_from_file_location("pending_email_change_migration", path)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    engine = create_engine("sqlite:///:memory:")
    try:
        with engine.begin() as connection:
            connection.execute(text('CREATE TABLE "user" (user_id INTEGER PRIMARY KEY)'))
            connection.execute(text('INSERT INTO "user" (user_id) VALUES (10), (20)'))
            monkeypatch.setattr(migration, "op", Operations(MigrationContext.configure(connection)))
            migration.upgrade()
            assert inspect(connection).get_pk_constraint("pending_email_changes")["constrained_columns"] == ["pending_email_change_id"]
            constraints = inspect(connection).get_unique_constraints("pending_email_changes")
            assert any(constraint["column_names"] == ["user_id"] for constraint in constraints)
            foreign_key = inspect(connection).get_foreign_keys("pending_email_changes")[0]
            assert foreign_key["referred_table"] == "user"
            assert foreign_key["options"]["ondelete"] == "CASCADE"
            indexes = inspect(connection).get_indexes("pending_email_changes")
            assert indexes[0]["unique"]
            with Session(bind=connection) as session:
                repo = PendingEmailChangeRepositoryImpl(session)
                expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
                first = PendingEmailChange(None, 10, "first@example.com", "a" * 64, expires_at)
                assert not first.is_persisted()
                repo.save(first)
                assert first.is_persisted()
                assert first.pending_email_change_id > 0

                other = PendingEmailChange(None, 20, "other@example.com", "c" * 64, expires_at)
                repo.save(other)
                assert other.pending_email_change_id != first.pending_email_change_id

                latest = PendingEmailChange(None, 10, "latest@example.com", "b" * 64, expires_at)
                repo.save(latest)
                assert latest.pending_email_change_id == first.pending_email_change_id
                assert session.query(PendingEmailChangeORM).count() == 2
                assert repo.get_by_token_hash("a" * 64) is None
                found = repo.get_by_token_hash("b" * 64)
                assert isinstance(found, PendingEmailChange)
                assert found.pending_email_change_id == first.pending_email_change_id
                assert found.user_id == 10
                assert found.mail == "latest@example.com"
                assert repo.get_by_token_hash("c" * 64).user_id == 20

                # El mapper y el repositorio también conservan el ID de una entidad persistida.
                repo.save(found)
                assert repo.get_by_token_hash("b" * 64).pending_email_change_id == first.pending_email_change_id
                with pytest.raises(IntegrityError), session.begin_nested():
                    session.add(PendingEmailChangeORM(
                        user_id=10, mail="duplicate@example.com",
                        token_hash="d" * 64, expires_at=expires_at,
                    ))
                    session.flush()
                assert repo.consume("b" * 64)
                assert not repo.consume("b" * 64)
                repo.delete_by_user_id(20)
                assert repo.get_by_token_hash("c" * 64) is None
                session.commit()
            migration.downgrade()
            assert "pending_email_changes" not in inspect(connection).get_table_names()
            assert connection.execute(text('SELECT user_id FROM "user" ORDER BY user_id')).scalars().all() == [10, 20]
    finally:
        engine.dispose()
