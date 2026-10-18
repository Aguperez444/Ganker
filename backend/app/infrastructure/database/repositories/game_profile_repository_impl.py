from sqlalchemy.orm import Session

from typing import TYPE_CHECKING, Optional

from datetime import datetime

from sqlalchemy import func, and_

from app.application.ports.i_game_profile_repository import IGameProfileRepository
from app.infrastructure.database.mappers.character_priority_mapper import CharacterPriorityMapper
from app.infrastructure.database.mappers.game_profile_mapper import GameProfileMapper
from app.infrastructure.database.mappers.role_profile_mapper import RoleProfileMapper
from app.infrastructure.database.mappers.videogame_mapper import VideogameMapper
from app.infrastructure.database.models.game_profile_orm import GameProfileORM
from app.infrastructure.database.models.videogame_orm import VideogameORM

if TYPE_CHECKING:
    from app.domain.models.game_profile import GameProfile
    from app.domain.models.videogame import Videogame

class GameProfileRepositoryImpl(IGameProfileRepository):
    def __init__(self, session: Session):
        self._session: Session = session

    def get_game_profile_by_id(self, game_profile_id: int) -> Optional['GameProfile']:
        found = self._session.query(GameProfileORM).filter(
            GameProfileORM.game_profile_id == game_profile_id,
            GameProfileORM.deleted == False,
        ).first()
        if found and (
            (found.user and getattr(found.user, "deleted", False))
            or (found.videogame and getattr(found.videogame, "deleted", False))
        ):
            return None
        domain_found = GameProfileMapper.orm_to_domain(found) if found else None
        return domain_found

    def get_game_profile_by_player_and_videogame(self, player_id: int, videogame_id: int) -> Optional['GameProfile']:
        found = self._session.query(GameProfileORM).filter(
            GameProfileORM.player_id == player_id,
            GameProfileORM.videogame_id == videogame_id,
            GameProfileORM.deleted == False,
        ).first()
        if found and (
            (found.user and getattr(found.user, "deleted", False))
            or (found.videogame and getattr(found.videogame, "deleted", False))
        ):
            return None
        domain_found = GameProfileMapper.orm_to_domain(found) if found else None
        return domain_found

    def get_by_user_id_and_game_id(self, user_id: int, game_id: int) -> Optional['GameProfile']:
        return self.get_game_profile_by_player_and_videogame(user_id, game_id)

    def create_game_profile(self, game_profile: 'GameProfile') -> 'GameProfile':
        orm_game_profile = GameProfileMapper.domain_to_orm(game_profile)
        self._session.add(orm_game_profile)
        self._session.flush() # para obtener el game_profile_id generado
        return GameProfileMapper.orm_to_domain(orm_game_profile)


    def update_game_profile(self, game_profile: 'GameProfile') -> 'GameProfile':
        # 1. Obtenemos la entidad gestionada por la sesión actual
        orm_existing = self._session.query(GameProfileORM).filter(
            GameProfileORM.game_profile_id == game_profile.game_profile_id,
            GameProfileORM.deleted == False,
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

        orm_existing.region_id = game_profile.region.region_id if game_profile.region else None
        orm_existing.in_game_name = game_profile.in_game_name

        self._session.flush()
        return GameProfileMapper.orm_to_domain(orm_existing)

    def disassociate_region(self, region_id: int) -> None:

        associations = self._session.query(GameProfileORM).filter(
            GameProfileORM.region_id == region_id,
            GameProfileORM.deleted == False,
        ).all()
        if not associations:
            return

        for game_profile in associations:
            game_profile.region_id = None

        self._session.flush()


    def delete_game_profile(self, game_profile_id: int) -> bool:
        orm_game_profile = self._session.query(GameProfileORM).filter(
            GameProfileORM.game_profile_id == game_profile_id
        ).first()
        if orm_game_profile:
            self._session.delete(orm_game_profile)
            self._session.flush()
            return True
        return False

    def get_profile_counts_by_videogame(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> list[tuple['Videogame', int]]:
        # LEFT JOIN contra los perfiles para incluir también los videojuegos sin perfiles (cantidad 0).
        # El filtro de fechas va en la condición del JOIN para no descartar dichos videojuegos.
        join_conditions = [
            VideogameORM.videogame_id == GameProfileORM.videogame_id,
            GameProfileORM.deleted.is_(False),
            GameProfileORM.user.has(deleted=False),
        ]
        if start_date is not None:
            join_conditions.append(GameProfileORM.created_at >= start_date)
        if end_date is not None:
            join_conditions.append(GameProfileORM.created_at <= end_date)

        rows = (
            self._session.query(VideogameORM, func.count(GameProfileORM.game_profile_id))
            .outerjoin(GameProfileORM, and_(*join_conditions))
            .filter(VideogameORM.deleted.is_(False))
            .group_by(VideogameORM.videogame_id)
            .all()
        )
        return [(VideogameMapper.orm_to_domain(videogame), int(count)) for videogame, count in rows]

    def soft_delete_game_profile(self, game_profile_id: int) -> bool:
        orm_game_profile = self._session.query(GameProfileORM).filter(
            GameProfileORM.game_profile_id == game_profile_id,
            GameProfileORM.deleted == False,
        ).first()
        if not orm_game_profile:
            return False
        orm_game_profile.deleted = True
        self._session.flush()
        return True

    def soft_delete_by_player_id(self, player_id: int) -> list[int]:
        profiles = self._session.query(GameProfileORM).filter(
            GameProfileORM.player_id == player_id,
            GameProfileORM.deleted == False,
        ).all()
        if not profiles:
            return []
        affected_ids = [p.game_profile_id for p in profiles]
        for profile in profiles:
            profile.deleted = True
        self._session.flush()
        return affected_ids

    def soft_delete_by_videogame_id(self, videogame_id: int) -> list[int]:
        profiles = self._session.query(GameProfileORM).filter(
            GameProfileORM.videogame_id == videogame_id,
            GameProfileORM.deleted == False,
        ).all()
        if not profiles:
            return []
        affected_ids = [p.game_profile_id for p in profiles]
        for profile in profiles:
            profile.deleted = True
        self._session.flush()
        return affected_ids