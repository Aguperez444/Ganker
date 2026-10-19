from sqlalchemy import create_engine, select, func
from sqlalchemy.orm import sessionmaker

from app.infrastructure.api.auth.password_hash_service import PasswordHashService
from app.infrastructure.config.settings import settings
from app.infrastructure.database.base import Base
from app.infrastructure.database.models import (
    CharacterORM,
    RankORM,
    RoleORM,
    TeamORM,
    UserORM,
    VideogameORM,
)
from app.infrastructure.database.seed_data import seed_database


def test_seed_database_production_only_seeds_initial_owner(monkeypatch):
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)

    monkeypatch.setattr(settings, "seed_demo_data", False)
    monkeypatch.setattr(settings, "initial_owner_name", "Prod Owner")
    monkeypatch.setattr(settings, "initial_owner_username", "prod_owner")
    monkeypatch.setattr(settings, "initial_owner_email", "owner@gankerweb.app")
    monkeypatch.setattr(settings, "initial_owner_password", "SuperSecret123")

    with SessionLocal() as session:
        seed_database(session)

        assert session.scalar(select(func.count()).select_from(VideogameORM)) == 0
        assert session.scalar(select(func.count()).select_from(RoleORM)) == 0
        assert session.scalar(select(func.count()).select_from(RankORM)) == 0
        assert session.scalar(select(func.count()).select_from(CharacterORM)) == 0
        assert session.scalar(select(func.count()).select_from(TeamORM)) == 0
        assert session.scalar(select(func.count()).select_from(UserORM)) == 1

        owner = session.scalar(select(UserORM).where(UserORM.username == "prod_owner"))
        assert owner is not None
        assert owner.role == "owner"
        assert owner.mail == "owner@gankerweb.app"
        assert PasswordHashService().verify_password("SuperSecret123", owner.password_hash)

        # Simular que el owner cambia su contraseña en producción y el contenedor se reinicia
        new_hash = PasswordHashService().hash_password("NuevaPassword999")
        owner.password_hash = new_hash
        session.commit()

    with SessionLocal() as session:
        seed_database(session)
        owner_after_restart = session.scalar(select(UserORM).where(UserORM.username == "prod_owner"))
        assert owner_after_restart is not None
        assert owner_after_restart.password_hash == new_hash
        assert PasswordHashService().verify_password("NuevaPassword999", owner_after_restart.password_hash)
