from __future__ import annotations

from typing import Optional

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine

from app.infrastructure.config.settings import settings


def create_db_engine(db_url: Optional[str] = None, **overrides) -> Engine:
    """
    Crea y retorna un Engine de SQLAlchemy con la configuración estándar del proyecto.
    - Si db_url no se pasa, toma settings.database_url (PostgreSQL en Docker, SQLite en local).
    - overrides: permite ajustar parámetros.
    """
    url = db_url or settings.database_url

    # para sqlite
    if url.startswith("sqlite"):
        engine_kwargs = {
            "echo": False,
            "connect_args": {
                "check_same_thread": False,
                "timeout": 30,
            },
        }
    else:
        # PostgreSQL u otros motores
        engine_kwargs = {
            "echo": False,
            "pool_pre_ping": True,
            "pool_size": 10,
            "max_overflow": 20,
        }



    final_kwargs = {**engine_kwargs, **overrides}
    engine = create_engine(url, **final_kwargs)

    # Forzar Foreign Keys en SQLite (PostgreSQL las valida por defecto)
    if url.startswith("sqlite"):
        @event.listens_for(engine, "connect")
        def _set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    return engine