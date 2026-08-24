from __future__ import annotations

from pathlib import Path
from typing import Optional

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine


_DEFAULT_KWARGS = dict(
    echo=False,
    connect_args={
        "timeout": 30,
    },
)


def create_db_engine(db_url: Optional[str] = None, **overrides) -> Engine:
    """
    Crea y retorna un Engine de SQLAlchemy con la configuración estándar del proyecto.
    - db_url: si no se pasa, asume la estándar
    - overrides: permite ajustar parámetros.
    """

    if db_url is None:
        database_dir = Path(__file__).resolve().parent # __file__ es el path del archivo actual, y parent es la carpeta que lo contiene
        database_path = database_dir / "db.db"
        db_url = f"sqlite:///{database_path}"

    kwargs = {**_DEFAULT_KWARGS, **overrides}
    return create_engine(db_url, **kwargs)