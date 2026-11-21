import importlib
from datetime import datetime, timedelta, timezone

from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import create_engine, inspect, text

from app.infrastructure.database.base import Base


def test_ban_end_audit_migration_preserves_dates_and_only_recovers_known_appeal_decisions(tmp_path, monkeypatch):
    engine = create_engine(f"sqlite:///{tmp_path / 'audit.db'}")
    migration = importlib.import_module("migrations.versions.c3e6a9b2d705_added_ban_end_audit")
    now = datetime.now(timezone.utc)
    future = now + timedelta(days=7)
    past = now - timedelta(days=1)
    with engine.begin() as connection:
        connection.execute(text('CREATE TABLE "user" (user_id INTEGER PRIMARY KEY, banned BOOLEAN NOT NULL)'))
        connection.execute(text('CREATE TABLE user_ban_record (id INTEGER PRIMARY KEY, banned_user_id INTEGER REFERENCES "user"(user_id), expires_at DATETIME)'))
        connection.execute(text('CREATE TABLE ban_appeal (id INTEGER PRIMARY KEY, ban_record_id INTEGER REFERENCES user_ban_record(id), status VARCHAR(20), resolved_at DATETIME, resolver_user_id INTEGER)'))
        connection.execute(text('INSERT INTO "user" (user_id, banned) VALUES (1, 1), (2, 0), (3, 0), (4, 0)'))
        connection.execute(text('INSERT INTO user_ban_record (id, banned_user_id, expires_at) VALUES (:id, :user, :expiration)'), [
            {"id": 1, "user": 1, "expiration": future},
            {"id": 2, "user": 2, "expiration": past},
            {"id": 3, "user": 3, "expiration": past},
        ])
        connection.execute(text('INSERT INTO ban_appeal (id, ban_record_id, status, resolved_at, resolver_user_id) VALUES (1, 3, :status, :date, 4)'), {"status": "accepted", "date": past})
        context = MigrationContext.configure(connection, opts={"target_metadata": Base.metadata})
        monkeypatch.setattr(migration, "op", Operations(context))
        original_dates = connection.execute(text("SELECT id, expires_at FROM user_ban_record ORDER BY id")).all()
        migration.upgrade()
        rows = connection.execute(text("SELECT id, ended_at, ended_by_user_id, end_reason FROM user_ban_record ORDER BY id")).mappings().all()
        assert rows[0]["end_reason"] is None
        assert rows[1]["end_reason"] == "unknown"
        assert rows[1]["ended_by_user_id"] is None
        assert rows[2]["end_reason"] == "appeal"
        assert rows[2]["ended_by_user_id"] == 4
        assert rows[2]["ended_at"]
        assert connection.execute(text("SELECT id, expires_at FROM user_ban_record ORDER BY id")).all() == original_dates
        inspector = inspect(connection)
        model = Base.metadata.tables["user_ban_record"]
        assert {ck["name"] for ck in inspector.get_check_constraints("user_ban_record")} == {ck.name for ck in model.constraints if ck.__class__.__name__ == "CheckConstraint"}
        assert "ix_user_ban_record_player_history" in {idx["name"] for idx in inspector.get_indexes("user_ban_record")}
        assert any(fk["constrained_columns"] == ["ended_by_user_id"] for fk in inspector.get_foreign_keys("user_ban_record"))
        migration.downgrade()
        assert "ended_at" not in {column["name"] for column in inspect(connection).get_columns("user_ban_record")}
        assert connection.scalar(text("SELECT COUNT(*) FROM user_ban_record")) == 3
    engine.dispose()
