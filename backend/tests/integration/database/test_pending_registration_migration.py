import importlib.util
from pathlib import Path

from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session

from app.domain.models.pending_registration import PendingRegistration
from app.application.services.registration_token_service import RegistrationTokenService
from app.infrastructure.database.repositories.pending_registration_repository_impl import PendingRegistrationRepositoryImpl
from datetime import datetime, timezone


def test_migrated_schema_supports_registration_repository_and_downgrade(monkeypatch):
    path = Path(__file__).parents[3] / "migrations/versions/d6a8c1e3f502_added_pending_registrations.py"
    spec = importlib.util.spec_from_file_location("pending_registration_migration", path)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    id_path = path.parent / "e7b9d2f4a603_pending_registration_id.py"
    id_spec = importlib.util.spec_from_file_location("pending_registration_id_migration", id_path)
    id_migration = importlib.util.module_from_spec(id_spec)
    id_spec.loader.exec_module(id_migration)
    engine = create_engine("sqlite:///:memory:")
    try:
        with engine.begin() as connection:
            monkeypatch.setattr(migration, "op", Operations(MigrationContext.configure(connection)))
            monkeypatch.setattr(id_migration, "op", Operations(MigrationContext.configure(connection)))
            migration.upgrade()
            connection.execute(text(
                "INSERT INTO pending_registrations (mail, username, name, password_hash, token_hash, expires_at) "
                "VALUES ('existing@example.com', 'existing', 'Existing', 'existing-hash', 'existing-token', '2026-10-23 12:00:00')"
            ))
            id_migration.upgrade()
            assert inspect(connection).get_pk_constraint("pending_registrations")["constrained_columns"] == ["registration_id"]
            indexes = {index["name"]: index for index in inspect(connection).get_indexes("pending_registrations")}
            assert indexes["ix_pending_registrations_mail"]["unique"]
            assert indexes["ix_pending_registrations_token_hash"]["unique"]
            with Session(bind=connection) as session:
                repo = PendingRegistrationRepositoryImpl(session)
                existing = repo.get_by_mail("existing@example.com")
                assert existing.is_persisted()
                assert existing.token_hash == "existing-token"
                assert existing.password_hash == "existing-hash"
                registration = PendingRegistration(None, "juan@example.com", "juancito", "Juan", "hashed-password", "", datetime.now(timezone.utc))
                RegistrationTokenService.renew(registration)
                repo.save(registration)
                assert registration.registration_id > existing.registration_id
                found = repo.get_by_token_hash(registration.token_hash)
                assert found.mail == "juan@example.com"
                assert found.registration_id == registration.registration_id
                assert repo.get_by_mail("JUAN@example.com").username == "juancito"
                assert repo.consume(registration.token_hash)
                assert not repo.consume(registration.token_hash)
                session.commit()
            id_migration.downgrade()
            assert inspect(connection).get_pk_constraint("pending_registrations")["constrained_columns"] == ["mail"]
            assert connection.execute(text("SELECT token_hash FROM pending_registrations")).scalar_one() == "existing-token"
            migration.downgrade()
            assert "pending_registrations" not in inspect(connection).get_table_names()
    finally:
        engine.dispose()
