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

    def update_game_profile(self, game_profile: 'GameProfile') -> 'GameProfile':
        # 1. Obtenemos la entidad gestionada por la sesión actual
        orm_existing = self._session.query(GameProfileORM).filter(
            GameProfileORM.game_profile_id == game_profile.game_profile_id
        ).first()

        if orm_existing:
            # 2. Vaciamos las colecciones y flusheamos para ejecutar los DELETE primero
            # esto significa que cada update va a borrar las relaciones existentes y luego insertar las nuevas, lo cual es más seguro que intentar hacer un merge directo
            orm_existing.character_associations.clear()
            orm_existing.role_profiles.clear()
            self._session.flush()

        # 3. Mapeamos y persistimos el nuevo estado sin riesgo de colisión
        orm_to_update = GameProfileMapper.domain_to_orm(game_profile)
        # merge() compara el estado actual de la base de datos con el objeto que se le pasa y
        # deduce qué relaciones se agregaron y cuáles se eliminaron.
        # (se tuvo que agregar el cascade en el game_profile_orm)
        merged_orm = self._session.merge(orm_to_update)
        self._session.flush()
        return GameProfileMapper.orm_to_domain(merged_orm)