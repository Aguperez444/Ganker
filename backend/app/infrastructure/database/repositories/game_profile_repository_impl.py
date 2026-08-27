from sqlalchemy.orm import Session

from typing import TYPE_CHECKING, Optional

from app.application.ports.i_game_profile_repository import IGameProfileRepository
from app.infrastructure.database.mappers.game_profile_mapper import GameProfileMapper
from app.infrastructure.database.models.game_profile_orm import GameProfileORM

if TYPE_CHECKING:
    from app.domain.models.game_profile import GameProfile

class GameProfileRepositoryImpl(IGameProfileRepository):
    def __init__(self, session: Session):
        self._session: Session = session
    #TODO agregar el método para crear role_profile
    def create_game_profile(self, game_profile: 'GameProfile') -> 'GameProfile':
        orm_game_profile = GameProfileMapper.domain_to_orm(game_profile)
        merged_orm = self._session.merge(orm_game_profile)
        self._session.flush() # para obtener el game_profile_id generado
        domain_game_profile = GameProfileMapper.orm_to_domain(merged_orm)
        return domain_game_profile

    def get_game_profile_by_id(self, game_profile_id: int) -> Optional['GameProfile']:
        found = self._session.query(GameProfileORM).filter(GameProfileORM.game_profile_id == game_profile_id).first()
        domain_found = GameProfileMapper.orm_to_domain(found) if found else None
        return domain_found

    def get_game_profile_by_player_and_videogame(self, player_id: int, videogame_id: int) -> Optional['GameProfile']:
        found = self._session.query(GameProfileORM).filter(
            GameProfileORM.player_id == player_id,
            GameProfileORM.videogame_id == videogame_id
        ).first()
        domain_found = GameProfileMapper.orm_to_domain(found) if found else None
        return domain_found