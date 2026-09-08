from abc import ABC, abstractmethod

from app.application.ports.i_character_repository import ICharacterRepository
from app.application.ports.i_game_profile_repository import IGameProfileRepository
from app.application.ports.i_user_repository import IUserRepository
from app.application.ports.i_rank_repository import IRankRepository
from app.application.ports.i_refresh_token_repository import IRefreshTokenRepository
from app.application.ports.i_role_repository import IRoleRepository
from app.application.ports.i_videogame_repository import IVideogameRepository

#abstract class
class IUnitOfWork(ABC):
    user_repo: IUserRepository
    game_profile_repo: 'IGameProfileRepository'
    videogame_repo: 'IVideogameRepository'
    role_repo: 'IRoleRepository'
    rank_repo: 'IRankRepository'
    character_repo: 'ICharacterRepository'
    refresh_token_repo: 'IRefreshTokenRepository'

    @abstractmethod
    def __enter__(self) -> 'IUnitOfWork':
        pass

    @abstractmethod
    def __exit__(self, exc_type, exc, tb) -> None:
        pass

    @abstractmethod
    def commit(self) -> None:
        pass

    @abstractmethod
    def rollback(self) -> None:
        pass