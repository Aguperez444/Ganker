"""Exercise the actual migration on an isolated SQLite schema with existing snapshots."""
import importlib.util
from pathlib import Path

import pytest
from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import create_engine, inspect, text


def test_general_report_migration_preserves_snapshots_and_refuses_lossy_downgrade(monkeypatch):
    migration_path = Path(__file__).parents[3] / "migrations/versions/7b2e6a91d304_general_usage_reports.py"
    spec = importlib.util.spec_from_file_location("general_report_migration", migration_path)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE game_usage_report (report_id INTEGER PRIMARY KEY, videogame_id INTEGER NOT NULL, videogame_name TEXT NOT NULL)"))
        connection.execute(text("INSERT INTO game_usage_report VALUES (1, 4, 'Original snapshot')"))
        monkeypatch.setattr(migration, "op", Operations(MigrationContext.configure(connection)))
        migration.upgrade()
        assert next(column for column in inspect(connection).get_columns("game_usage_report") if column["name"] == "videogame_id")["nullable"]
        assert tuple(connection.execute(text("SELECT * FROM game_usage_report")).one()) == (1, 4, "Original snapshot")
        connection.execute(text("INSERT INTO game_usage_report VALUES (2, NULL, 'Todos los videojuegos')"))
        with pytest.raises(RuntimeError, match="reportes generales"):
            migration.downgrade()
        assert connection.scalar(text("SELECT COUNT(*) FROM game_usage_report")) == 2
        connection.execute(text("DELETE FROM game_usage_report WHERE report_id = 2"))
        migration.downgrade()
        assert not next(column for column in inspect(connection).get_columns("game_usage_report") if column["name"] == "videogame_id")["nullable"]
        assert connection.scalar(text("SELECT videogame_id FROM game_usage_report")) == 4
    engine.dispose()
