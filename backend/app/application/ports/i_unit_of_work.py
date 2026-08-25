from typing import Protocol

from app.application.ports.i_player_repository import IPlayerRepository

class IUnitOfWork(Protocol):
    player_repo: IPlayerRepository

    def __enter__(self) -> 'IUnitOfWork':
        pass

    def __exit__(self, exc_type, exc, tb) -> None:
        pass


    def commit(self) -> None:
        pass

    def rollback(self) -> None:
        pass
