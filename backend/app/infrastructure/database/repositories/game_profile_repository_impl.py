from sqlalchemy.orm import Session

from typing import TYPE_CHECKING, Optional

from app.application.ports.i_game_profile_repository import IGameProfileRepository
from app.infrastructure.database.mappers.character_priority_mapper import CharacterPriorityMapper
from app.infrastructure.database.mappers.game_profile_mapper import GameProfileMapper
from app.infrastructure.database.mappers.role_profile_mapper import RoleProfileMapper
from app.infrastructure.database.models.game_profile_orm import GameProfileORM

if TYPE_CHECKING:
    from app.domain.models.game_profile import GameProfile

class GameProfileRepositoryImpl(IGameProfileRepository):
    def __init__(self, session: Session):
        self._session: Session = session

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

    def create_game_profile(self, game_profile: 'GameProfile') -> 'GameProfile':
        orm_game_profile = GameProfileMapper.domain_to_orm(game_profile)
        self._session.add(orm_game_profile)
        self._session.flush() # para obtener el game_profile_id generado
        return GameProfileMapper.orm_to_domain(orm_game_profile)


    def update_game_profile(self, game_profile: 'GameProfile') -> 'GameProfile':
        # 1. Obtenemos la entidad gestionada por la sesión actual
        orm_existing = self._session.query(GameProfileORM).filter(
            GameProfileORM.game_profile_id == game_profile.game_profile_id
        ).first()

        if not orm_existing:
            raise ValueError(f"No se encontró el GameProfile con ID: {game_profile.game_profile_id}, esto debería haber sido válidado antes de llegar a este punto.")

        # 2. Vaciamos las colecciones y flusheamos para ejecutar los DELETE primero
        # esto significa que cada update va a borrar las relaciones existentes y luego insertar las nuevas,
        # lo cual es más seguro que intentar hacer un merge directo
        orm_existing.character_associations.clear()
        orm_existing.role_profiles.clear()

        # Garantiza que los hijos anteriores se eliminen antes de insertar
        # los nuevos registros, evitando conflictos con las restricciones únicas.
        self._session.flush()

        orm_existing.character_associations.extend(
            CharacterPriorityMapper.domain_to_orm(character_priority)
            for character_priority in game_profile.characters_priority
        )
        orm_existing.role_profiles.extend(
            RoleProfileMapper.domain_to_orm(role_profile)
            for role_profile in game_profile.role_profiles
        )

        self._session.flush()
        return GameProfileMapper.orm_to_domain(orm_existing)

    def delete_game_profile(self, game_profile_id: int) -> bool:
        orm_game_profile = self._session.query(GameProfileORM).filter(
            GameProfileORM.game_profile_id == game_profile_id
        ).first()
        if orm_game_profile:
            self._session.delete(orm_game_profile)
            self._session.flush()
            return True
        return False