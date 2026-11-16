import importlib

from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import create_engine, inspect, text


def test_report_game_migration_preserves_history_and_can_be_reversed(tmp_path, monkeypatch):
    engine = create_engine(f"sqlite:///{tmp_path / 'reports.db'}")
    migration = importlib.import_module("migrations.versions.e5a8b1d4f927_player_report_videogame")
    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE videogame (videogame_id INTEGER PRIMARY KEY)"))
        connection.execute(text("CREATE TABLE player_report (id INTEGER PRIMARY KEY, description TEXT)"))
        connection.execute(text("INSERT INTO player_report VALUES (1, 'Histórica')"))
        monkeypatch.setattr(migration, "op", Operations(MigrationContext.configure(connection)))
        migration.upgrade()
        assert connection.execute(text("SELECT id, description, videogame_id FROM player_report")).one() == (1, "Histórica", None)
        fk = inspect(connection).get_foreign_keys("player_report")[0]
        assert fk["referred_table"] == "videogame"
        assert fk["options"]["ondelete"] == "SET NULL"
        assert "ix__player_report__videogame_id" in {index["name"] for index in inspect(connection).get_indexes("player_report")}
        migration.downgrade()
        assert connection.execute(text("SELECT * FROM player_report")).one() == (1, "Histórica")
        assert "videogame_id" not in {column["name"] for column in inspect(connection).get_columns("player_report")}
    engine.dispose()
