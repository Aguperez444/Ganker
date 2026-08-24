from sqlalchemy.orm import sessionmaker
from app.infrastructure.database.unit_of_work.unit_of_work_impl import SqlAlchemyUnitOfWork
from app.infrastructure.database.engine_factory import create_db_engine

engine = create_db_engine()

SessionLocal = sessionmaker(bind=engine)

def uow_factory() -> SqlAlchemyUnitOfWork:
    return SqlAlchemyUnitOfWork(SessionLocal)