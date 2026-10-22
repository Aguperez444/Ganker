import os
from uuid import uuid4

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.infrastructure.database.base import Base


@pytest.fixture
def postgres_sessions():
    url = os.environ.get("GANKER_TEST_POSTGRES_URL")
    if not url:
        pytest.skip("GANKER_TEST_POSTGRES_URL no configurada")
    schema = f"test_ganker_{uuid4().hex}"
    engine = create_engine(url, connect_args={"options": f"-csearch_path={schema} -cTimeZone=UTC"})
    try:
        with engine.begin() as connection:
            connection.execute(text(f'CREATE SCHEMA "{schema}"'))
        Base.metadata.create_all(engine)
        yield sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    finally:
        with engine.begin() as connection:
            connection.execute(text(f'DROP SCHEMA IF EXISTS "{schema}" CASCADE'))
        engine.dispose()
