from typing import Callable
from sqlalchemy.orm import Session

from app.application.ports.i_player_repository import IPlayerRepository
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.database.repositories.player_repository_impl import PlayerRepositoryImpl

SessionFactory = Callable[[], Session]

class SqlAlchemyUnitOfWork(IUnitOfWork):
    """
    UoW mínimo: crea una Session al entrar, hace commit/rollback al salir.
    Acepta un session_factory (por ej. `SessionLocal = session_maker(...)`).
    """

    def __init__(self, session_factory: SessionFactory) -> None:
        self._sf: SessionFactory = session_factory
        # propiedades inicializadas en __enter__
        self.session: Session
        self.player_repo: IPlayerRepository
    # Context manager
    def __enter__(self) -> 'SqlAlchemyUnitOfWork':
        self.session: Session = self._sf()  # nueva Session por acción
        self.player_repo: IPlayerRepository = PlayerRepositoryImpl(self.session)

        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        try:
            if exc_type is None:
                self.session.commit()
            else:
                self.session.rollback()
        finally:
            self.session.close()

    def commit(self) -> None:
        assert self.session is not None, "UoW sin session (¿usaste 'with uow:'?)"
        self.session.commit()

    def rollback(self) -> None:
        assert self.session is not None, "UoW sin session"
        self.session.rollback()
