import importlib
from datetime import datetime, timedelta, timezone

from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import create_engine, text


def test_legacy_unknown_closures_become_expired_without_changing_known_decisions(tmp_path, monkeypatch):
    engine = create_engine(f"sqlite:///{tmp_path / 'legacy.db'}")
    migration = importlib.import_module("migrations.versions.d4f7a0c3e816_legacy_bans_expired")
    now = datetime.now(timezone.utc)
    past = now - timedelta(days=7)
    future = now + timedelta(days=7)
    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE user_ban_record (id INTEGER PRIMARY KEY, expires_at DATETIME, ended_at DATETIME, ended_by_user_id INTEGER, end_reason VARCHAR(20))"))
        connection.execute(text("INSERT INTO user_ban_record (id, expires_at, ended_by_user_id, end_reason) VALUES (:id, :expiration, :actor, :reason)"), [
            {"id": 1, "expiration": past.isoformat(), "actor": None, "reason": "unknown"},
            {"id": 2, "expiration": None, "actor": None, "reason": "unknown"},
            {"id": 3, "expiration": future.isoformat(), "actor": None, "reason": "unknown"},
            {"id": 4, "expiration": future.isoformat(), "actor": 7, "reason": "manual"},
            {"id": 5, "expiration": future.isoformat(), "actor": 8, "reason": "appeal"},
            {"id": 6, "expiration": future.isoformat(), "actor": None, "reason": None},
        ])
        monkeypatch.setattr(migration, "op", Operations(MigrationContext.configure(connection)))
        migration.upgrade()
        rows = connection.execute(text("SELECT * FROM user_ban_record ORDER BY id")).mappings().all()
        assert [row["end_reason"] for row in rows] == ["expired", "expired", "expired", "manual", "appeal", None]
        assert rows[0]["ended_at"]
        for row in rows[:3]:
            assert datetime.fromisoformat(row["ended_at"]).replace(tzinfo=timezone.utc) <= datetime.now(timezone.utc)
            assert row["ended_by_user_id"] is None
        assert [rows[3]["ended_by_user_id"], rows[4]["ended_by_user_id"]] == [7, 8]
        migration.upgrade()
        assert connection.execute(text("SELECT * FROM user_ban_record ORDER BY id")).mappings().all() == rows
    engine.dispose()
