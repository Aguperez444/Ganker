import pytest
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.infrastructure.database.base import Base
# Import all ORM models to ensure they are registered with Base.metadata
import app.infrastructure.database.models.user_orm
import app.infrastructure.database.models.videogame_orm
import app.infrastructure.database.models.character_orm
import app.infrastructure.database.models.rank_orm
import app.infrastructure.database.models.role_orm
import app.infrastructure.database.models.game_profile_orm
import app.infrastructure.database.models.role_profile_orm
import app.infrastructure.database.models.character_priority_orm
import app.infrastructure.database.models.refresh_token_orm

from app.infrastructure.database.models.videogame_orm import VideogameORM
from app.infrastructure.database.models.character_orm import CharacterORM
from app.infrastructure.database.models.role_orm import RoleORM
from app.infrastructure.database.models.rank_orm import RankORM
from app.infrastructure.database.models.user_orm import UserORM

from app.infrastructure.database.unit_of_work.unit_of_work_impl import SqlAlchemyUnitOfWork
from app.infrastructure.api.auth.jwt_token_service import JwtTokenService
from app.infrastructure.api.auth.password_hash_service import PasswordHashService
from app.infrastructure.start.main import app
import app.infrastructure.database.unit_of_work.uow_factory as uow_factory_module
import app.infrastructure.api.controllers.user_controller as user_ctrl_module
import app.infrastructure.api.controllers.auth_controller as auth_ctrl_module
import app.infrastructure.api.controllers.game_profile_controller as gp_ctrl_module
import app.infrastructure.api.controllers.videogame_controller as vg_ctrl_module
import app.infrastructure.api.controllers.character_controller as char_ctrl_module
import app.infrastructure.api.controllers.role_controller as role_ctrl_module
import app.infrastructure.api.controllers.rank_controller as rank_ctrl_module

from app.domain.models.user_role import UserRole


TEST_JWT_SECRET = "test-secret-key-for-unit-and-integration-tests-12345"


@pytest.fixture(scope="function")
def test_engine():
    """Create an isolated in-memory SQLite database for each test."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(scope="function")
def test_session_factory(test_engine):
    """SessionFactory bound to the test engine."""
    return sessionmaker(bind=test_engine, autoflush=False, autocommit=False, expire_on_commit=False)


@pytest.fixture(scope="function")
def test_db_session(test_session_factory):
    """Provides a fresh database session for a test."""
    session: Session = test_session_factory()
    yield session
    session.close()


@pytest.fixture(scope="function")
def test_uow(test_session_factory):
    """Unit of Work pointing to the test in-memory database."""
    return SqlAlchemyUnitOfWork(test_session_factory)


@pytest.fixture(scope="function")
def jwt_service():
    """JWT Token Service for tests."""
    return JwtTokenService(secret_key=TEST_JWT_SECRET, access_expiration_minutes=30, refresh_expiration_days=7)


@pytest.fixture(scope="function")
def password_hasher():
    """Password Hash Service for tests."""
    return PasswordHashService()


@pytest.fixture(scope="function")
def seed_catalog_data(test_db_session):
    """Seeds sample videogames, characters, roles, and ranks for tests."""
    videogame = VideogameORM(
        name="League of Legends",
        icon_url="/media/games/league_of_legends/icon.png",
        rank_per_role=True
    )
    test_db_session.add(videogame)
    test_db_session.flush()

    char1 = CharacterORM(name="Ahri", videogame_id=videogame.videogame_id, icon_url="/media/games/league_of_legends/characters/ahri.png")
    char2 = CharacterORM(name="Yasuo", videogame_id=videogame.videogame_id, icon_url="/media/games/league_of_legends/characters/yasuo.png")
    char3 = CharacterORM(name="Jinx", videogame_id=videogame.videogame_id, icon_url="/media/games/league_of_legends/characters/jinx.png")
    test_db_session.add_all([char1, char2, char3])

    role1 = RoleORM(name="Mid", videogame_id=videogame.videogame_id, icon_url="/media/games/league_of_legends/roles/mid.png")
    role2 = RoleORM(name="ADC", videogame_id=videogame.videogame_id, icon_url="/media/games/league_of_legends/roles/adc.png")
    role3 = RoleORM(name="Top", videogame_id=videogame.videogame_id, icon_url="/media/games/league_of_legends/roles/top.png")
    test_db_session.add_all([role1, role2, role3])

    rank1 = RankORM(name="Gold", value=1000, videogame_id=videogame.videogame_id, icon_url="/media/games/league_of_legends/ranks/gold.png")
    rank2 = RankORM(name="Platinum", value=2000, videogame_id=videogame.videogame_id, icon_url="/media/games/league_of_legends/ranks/platinum.png")
    rank3 = RankORM(name="Diamond", value=3000, videogame_id=videogame.videogame_id, icon_url="/media/games/league_of_legends/ranks/diamond.png")
    test_db_session.add_all([rank1, rank2, rank3])

    test_db_session.commit()
    test_db_session.refresh(videogame)
    test_db_session.refresh(char1)
    test_db_session.refresh(char2)
    test_db_session.refresh(char3)
    test_db_session.refresh(role1)
    test_db_session.refresh(role2)
    test_db_session.refresh(role3)
    test_db_session.refresh(rank1)
    test_db_session.refresh(rank2)
    test_db_session.refresh(rank3)

    return {
        "videogame": videogame,
        "characters": [char1, char2, char3],
        "roles": [role1, role2, role3],
        "ranks": [rank1, rank2, rank3],
    }


@pytest.fixture(scope="function")
def seed_player(test_db_session, password_hasher):
    """Seeds a registered player in the test DB."""
    player = UserORM(
        name="John Doe",
        username="johndoe",
        mail="john.doe@example.com",
        password_hash=password_hasher.hash_password("Password123"),
        role="player",
        icon_url="/media/users/icons/johndoe.png"
    )
    test_db_session.add(player)
    test_db_session.commit()
    test_db_session.refresh(player)
    return player


@pytest.fixture(scope="function")
def seed_admin(test_db_session, password_hasher):
    """Seeds an admin user in the test DB."""
    admin = UserORM(
        name="Admin User",
        username="adminuser",
        mail="admin@example.com",
        password_hash=password_hasher.hash_password("AdminPass123"),
        role="admin",
        icon_url="/media/users/icons/admin.png"
    )
    test_db_session.add(admin)
    test_db_session.commit()
    test_db_session.refresh(admin)
    return admin


@pytest.fixture(scope="function")
def seed_owner(test_db_session, password_hasher):
    """Seeds an owner user in the test DB."""
    owner = UserORM(
        name="Owner User",
        username="owneruser",
        mail="owner@example.com",
        password_hash=password_hasher.hash_password("OwnerPass123"),
        role="owner",
        icon_url="/media/users/icons/owner.png"
    )
    test_db_session.add(owner)
    test_db_session.commit()
    test_db_session.refresh(owner)
    return owner


@pytest.fixture(scope="function")
def player_auth_headers(jwt_service, seed_player):
    """Headers with valid access token for seed_player."""
    token, _, _, _ = jwt_service.generate_tokens(user_id=seed_player.user_id, role=UserRole.PLAYER)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def admin_auth_headers(jwt_service, seed_admin):
    """Headers with valid access token for seed_admin."""
    token, _, _, _ = jwt_service.generate_tokens(user_id=seed_admin.user_id, role=UserRole.ADMIN)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def owner_auth_headers(jwt_service, seed_owner):
    """Headers with valid access token for seed_owner."""
    token, _, _, _ = jwt_service.generate_tokens(user_id=seed_owner.user_id, role=UserRole.OWNER)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def client(monkeypatch, test_session_factory, jwt_service, tmp_path):
    """FastAPI TestClient with monkeypatched uow_factory, jwt secret, and temp media dir."""
    test_uow_factory = lambda: SqlAlchemyUnitOfWork(test_session_factory)

    # Monkeypatch uow_factory in factory and all controllers
    monkeypatch.setattr(uow_factory_module, "uow_factory", test_uow_factory)
    monkeypatch.setattr(user_ctrl_module, "uow_factory", test_uow_factory)
    monkeypatch.setattr(auth_ctrl_module, "uow_factory", test_uow_factory)
    monkeypatch.setattr(gp_ctrl_module, "uow_factory", test_uow_factory)
    monkeypatch.setattr(vg_ctrl_module, "uow_factory", test_uow_factory)
    monkeypatch.setattr(char_ctrl_module, "uow_factory", test_uow_factory)
    monkeypatch.setattr(role_ctrl_module, "uow_factory", test_uow_factory)
    monkeypatch.setattr(rank_ctrl_module, "uow_factory", test_uow_factory)

    # Isolated temp directory for media uploads during tests
    temp_media = tmp_path / "media"
    temp_media.mkdir(parents=True, exist_ok=True)
    from app.infrastructure.config.settings import settings
    monkeypatch.setattr(settings, "jwt_secret_key", TEST_JWT_SECRET)
    monkeypatch.setattr(settings, "media_dir", temp_media)

    import app.infrastructure.api.dependencies.auth as auth_dep
    monkeypatch.setattr(auth_dep, "token_service", jwt_service)

    with TestClient(app) as test_client:
        yield test_client
