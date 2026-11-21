import importlib

from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import create_engine, inspect, text

from app.infrastructure.database.base import Base


def test_ban_appeal_migration_preserves_bans_and_matches_new_tables(tmp_path, monkeypatch):
    engine = create_engine(f"sqlite:///{tmp_path / 'migration.db'}")
    migration = importlib.import_module("migrations.versions.b2d5f8a1c604_added_ban_appeals")
    with engine.begin() as connection:
        connection.execute(text('CREATE TABLE "user" (user_id INTEGER PRIMARY KEY)'))
        connection.execute(text('CREATE TABLE user_ban_record (id INTEGER PRIMARY KEY, banned_user_id INTEGER)'))
        connection.execute(text('INSERT INTO "user" (user_id) VALUES (1)'))
        connection.execute(text('INSERT INTO user_ban_record (id, banned_user_id) VALUES (7, 1)'))
        context = MigrationContext.configure(connection, opts={"target_metadata": Base.metadata})
        monkeypatch.setattr(migration, "op", Operations(context))
        migration.upgrade()
        inspector = inspect(connection)
        assert inspector.get_unique_constraints("ban_appeal")[0]["column_names"] == ["ban_record_id"]
        assert len(inspector.get_foreign_keys("ban_appeal")) == 2
        for name in ("ban_appeal", "ban_appeal_image"):
            model = Base.metadata.tables[name]
            assert {col["name"] for col in inspector.get_columns(name)} == set(model.columns.keys())
            assert {idx["name"] for idx in inspector.get_indexes(name)} == {idx.name for idx in model.indexes}
            assert {ck["name"] for ck in inspector.get_check_constraints(name)} == {ck.name for ck in model.constraints if ck.__class__.__name__ == "CheckConstraint"}
        assert connection.scalar(text("SELECT banned_user_id FROM user_ban_record WHERE id = 7")) == 1
        migration.downgrade()
        assert "ban_appeal" not in inspect(connection).get_table_names()
        assert "ban_appeal_image" not in inspect(connection).get_table_names()
        assert connection.scalar(text("SELECT banned_user_id FROM user_ban_record WHERE id = 7")) == 1
    engine.dispose()
