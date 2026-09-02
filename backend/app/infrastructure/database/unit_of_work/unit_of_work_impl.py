from typing import Callable
from sqlalchemy.orm import Session

from app.application.ports.i_character_repository import ICharacterRepository
from app.application.ports.i_game_profile_repository import IGameProfileRepository
from app.application.ports.i_player_repository import IPlayerRepository
from app.application.ports.i_rank_repository import IRankRepository
from app.application.ports.i_refresh_token_repository import IRefreshTokenRepository
from app.application.ports.i_role_repository import IRoleRepository
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.application.ports.i_videogame_repository import IVideogameRepository
from app.infrastructure.database.repositories.character_repository_impl import CharacterRepositoryImpl
from app.infrastructure.database.repositories.game_profile_repository_impl import GameProfileRepositoryImpl
from app.infrastructure.database.repositories.player_repository_impl import PlayerRepositoryImpl
from app.infrastructure.database.repositories.rank_repository_impl import RankRepositoryImpl
from app.infrastructure.database.repositories.refresh_token_repository_impl import RefreshTokenRepositoryImpl
from app.infrastructure.database.repositories.role_repository_impl import RoleRepositoryImpl
from app.infrastructure.database.repositories.videogame_repository_impl import VideogameRepositoryImpl

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
        self.game_profile_repo: IGameProfileRepository
        self.videogame_repo: IVideogameRepository
        self.role_repo: IRoleRepository
        self.rank_repo: IRankRepository
        self.character_repo: ICharacterRepository
        self.refresh_token_repo: IRefreshTokenRepository
    # Context manager
    def __enter__(self) -> 'SqlAlchemyUnitOfWork':
        self.session: Session = self._sf()  # nueva Session por acción
        self.player_repo: IPlayerRepository = PlayerRepositoryImpl(self.session)
        self.game_profile_repo: IGameProfileRepository = GameProfileRepositoryImpl(self.session)
        self.videogame_repo: IVideogameRepository = VideogameRepositoryImpl(self.session)
        self.role_repo: IRoleRepository = RoleRepositoryImpl(self.session)
        self.rank_repo: IRankRepository = RankRepositoryImpl(self.session)
        self.character_repo: ICharacterRepository = CharacterRepositoryImpl(self.session)
        self.refresh_token_repo: IRefreshTokenRepository = RefreshTokenRepositoryImpl(self.session)
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
