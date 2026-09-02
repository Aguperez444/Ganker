from typing import Protocol

from app.application.ports.i_character_repository import ICharacterRepository
from app.application.ports.i_game_profile_repository import IGameProfileRepository
from app.application.ports.i_player_repository import IPlayerRepository
from app.application.ports.i_rank_repository import IRankRepository
from app.application.ports.i_refresh_token_repository import IRefreshTokenRepository
from app.application.ports.i_role_repository import IRoleRepository
from app.application.ports.i_videogame_repository import IVideogameRepository


class IUnitOfWork(Protocol):
    player_repo: IPlayerRepository
    game_profile_repo: 'IGameProfileRepository'
    videogame_repo: 'IVideogameRepository'
    role_repo: 'IRoleRepository'
    rank_repo: 'IRankRepository'
    character_repo: 'ICharacterRepository'
    refresh_token_repo: 'IRefreshTokenRepository'

    def __init__(self):
        pass
    def __enter__(self) -> 'IUnitOfWork':
        pass

    def __exit__(self, exc_type, exc, tb) -> None:
        pass

    def commit(self) -> None:
        pass

    def rollback(self) -> None:
        pass