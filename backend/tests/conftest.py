import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.infrastructure.database.base import Base
# Import all ORM models to ensure they are registered with Base.metadata
import app.infrastructure.database.models.associations
import app.infrastructure.database.models.player_orm
import app.infrastructure.database.models.videogame_orm
import app.infrastructure.database.models.character_orm
import app.infrastructure.database.models.rank_orm
import app.infrastructure.database.models.role_orm
import app.infrastructure.database.models.game_profile_orm
import app.infrastructure.database.models.role_profile_orm

from app.infrastructure.database.models.videogame_orm import VideogameORM
from app.infrastructure.database.models.character_orm import CharacterORM
from app.infrastructure.database.models.role_orm import RoleORM
from app.infrastructure.database.models.rank_orm import RankORM
from app.infrastructure.database.models.player_orm import PlayerORM

from app.infrastructure.database.unit_of_work.unit_of_work_impl import SqlAlchemyUnitOfWork
from app.infrastructure.api.auth.jwt_token_service import JwtTokenService
from app.infrastructure.api.auth.password_hash_service import PasswordHashService
from app.infrastructure.start.main import app
import app.infrastructure.database.unit_of_work.uow_factory as uow_factory_module
import app.infrastructure.api.controllers.player_controller as player_ctrl_module
import app.infrastructure.api.controllers.auth_controller as auth_ctrl_module
import app.infrastructure.api.controllers.game_profile_controller as gp_ctrl_module


TEST_JWT_SECRET = "test-secret-key-for-unit-and-integration-tests-12345"

# Crear una bdd en ram que levante todas las tablas de los models del ORM
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

# crea una sesión que esta conectada a la bdd en ram
@pytest.fixture(scope="function")
def test_session_factory(test_engine):
    """SessionFactory bound to the test engine."""
    return sessionmaker(bind=test_engine, autoflush=False, autocommit=False, expire_on_commit=False)

# lo mismo que la de arriba, o en realidad la de arriba era una session factory y esta es la session real
@pytest.fixture(scope="function")
def test_db_session(test_session_factory):
    """Provides a fresh database session for a test."""
    session: Session = test_session_factory()
    yield session
    session.close()

# crea una unit of work *usando la imlementación reak* pero que queda conectada a la bdd en ram, para que los tests puedan usarla
@pytest.fixture(scope="function")
def test_uow(test_session_factory):
    """Unit of Work pointing to the test in-memory database."""
    return SqlAlchemyUnitOfWork(test_session_factory)

# crea un servicio de tokens JWT para los tests, con un secret key de prueba y expiraciones cortas
@pytest.fixture(scope="function")
def jwt_service():
    """JWT Token Service for tests."""
    return JwtTokenService(secret_key=TEST_JWT_SECRET, access_expiration_minutes=30, refresh_expiration_days=7)

# crea un servicio de hash de passwords para los tests
@pytest.fixture(scope="function")
def password_hasher():
    """Password Hash Service for tests."""
    return PasswordHashService()

# inserata datos en la bdd de prueba para que no este vacía
@pytest.fixture(scope="function")
def seed_catalog_data(test_db_session):
    """Seeds sample videogames, characters, roles, and ranks for tests."""
    videogame = VideogameORM(name="League of Legends")
    test_db_session.add(videogame)
    test_db_session.flush()

    char1 = CharacterORM(name="Ahri", videogame_id=videogame.videogame_id)
    char2 = CharacterORM(name="Yasuo", videogame_id=videogame.videogame_id)
    char3 = CharacterORM(name="Jinx", videogame_id=videogame.videogame_id)
    test_db_session.add_all([char1, char2, char3])

    role1 = RoleORM(name="Mid", videogame_id=videogame.videogame_id)
    role2 = RoleORM(name="ADC", videogame_id=videogame.videogame_id)
    role3 = RoleORM(name="Top", videogame_id=videogame.videogame_id)
    test_db_session.add_all([role1, role2, role3])

    rank1 = RankORM(name="Gold", value=1000, videogame_id=videogame.videogame_id)
    rank2 = RankORM(name="Platinum", value=2000, videogame_id=videogame.videogame_id)
    rank3 = RankORM(name="Diamond", value=3000, videogame_id=videogame.videogame_id)
    test_db_session.add_all([rank1, rank2, rank3])

    test_db_session.commit()

    return {
        "videogame": videogame,
        "characters": [char1, char2, char3],
        "roles": [role1, role2, role3],
        "ranks": [rank1, rank2, rank3],
    }


@pytest.fixture(scope="function")
def seed_player(test_db_session, password_hasher):
    """Seeds a registered player in the test DB."""
    player = PlayerORM(
        name="John Doe",
        username="johndoe",
        mail="john.doe@example.com",
        password_hash=password_hasher.hash_password("Password123"),
    )
    test_db_session.add(player)
    test_db_session.commit()
    test_db_session.refresh(player)
    return player


# esto permite levantar el fastAPI pero cambiando los modulos en caliente, para que use la bdd falsa y no la real, lo mismo con los token jwt y la secret key
@pytest.fixture(scope="function")
def client(monkeypatch, test_session_factory, jwt_service):
    """FastAPI TestClient with monkeypatched uow_factory and jwt secret."""
    test_uow_factory = lambda: SqlAlchemyUnitOfWork(test_session_factory)
    monkeypatch.setattr(uow_factory_module, "uow_factory", test_uow_factory)
    monkeypatch.setattr(player_ctrl_module, "uow_factory", test_uow_factory)
    monkeypatch.setattr(auth_ctrl_module, "uow_factory", test_uow_factory)
    monkeypatch.setattr(gp_ctrl_module, "uow_factory", test_uow_factory)

    from app.infrastructure.config.settings import settings
    monkeypatch.setattr(settings, "jwt_secret_key", TEST_JWT_SECRET)

    import app.infrastructure.api.dependencies.auth as auth_dep
    monkeypatch.setattr(auth_dep, "token_service", jwt_service)

    with TestClient(app) as test_client:
        yield test_client

