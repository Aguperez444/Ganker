from typing import Callable
from sqlalchemy.orm import Session


from app.infrastructure.database.unit_of_work.unit_of_work import IUnitOfWork
from app.infrastructure.database.repositories.Simulacion_repository_impl import SimulacionRepositoryImpl
from app.infrastructure.database.repositories.Coleccion_repository_impl import ColeccionRepositoryImpl
from app.infrastructure.database.repositories.acum_reposiroty_impl import AcumEquiposRepositoryImpl

SessionFactory = Callable[[], Session]

class SqlAlchemyUnitOfWork(IUnitOfWork):
    """
        UoW mínimo: crea una Session al entrar, hace commit/rollback al salir.
        Acepta un session_factory (por ej. `SessionLocal = session_maker(...)`).
        """

    def __init__(self, session_factory: SessionFactory) -> None:
        self._sf = session_factory
        # propiedades inicializadas en __enter__
        self.session: Session
        self.simu_repo: SimulacionRepositoryImpl
        self.colec_repo: ColeccionRepositoryImpl
        self.acum_repo: AcumEquiposRepositoryImpl

    # Context manager
    def __enter__(self) -> 'SqlAlchemyUnitOfWork':
        self.session: Session = self._sf()  # nueva Session por acción
        self.simu_repo: SimulacionRepositoryImpl = SimulacionRepositoryImpl(self.session)
        self.colec_repo: ColeccionRepositoryImpl = ColeccionRepositoryImpl(self.session)
        self.acum_repo: AcumEquiposRepositoryImpl = AcumEquiposRepositoryImpl(self.session)
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        try:
            if exc_type is None:
                self.session.commit()
            else:
                self.session.rollback()
        finally:
            self.session.close()
            self.session = None
            self.simu_repo = None
            self.colec_repo = None


    def commit(self) -> None:
        assert self.session is not None, "UoW sin session (¿usaste 'with uow:'?)"
        self.session.commit()

    def rollback(self) -> None:
        assert self.session is not None, "UoW sin session"
        self.session.rollback()

UowFactory = Callable[[], IUnitOfWork]