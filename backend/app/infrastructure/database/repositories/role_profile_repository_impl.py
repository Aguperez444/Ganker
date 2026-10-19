from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy.orm import selectinload
from sqlalchemy import func

from app.application.ports.i_role_profile_repository import IRoleProfileRepository
from app.infrastructure.database.mappers.rank_mapper import RankMapper
from app.infrastructure.database.models import GameProfileORM, RankORM, RoleProfileORM

if TYPE_CHECKING:
    from app.domain.models.rank import Rank


class RoleProfileRepositoryImpl(IRoleProfileRepository):

    def __init__(self, session):
        self.session = session

    def reassign_associated_to_rank(self, source_rank_id: int, target_rank_id: int) -> int:
        updated_rows = self.session.query(RoleProfileORM).filter(
            RoleProfileORM.rank_id == source_rank_id,
            RoleProfileORM.deleted == False,
        ).update({RoleProfileORM.rank_id: target_rank_id}, synchronize_session='fetch')
        self.session.flush()
        return updated_rows

    def count_associated_to_rank(self, rank_id: int) -> int:
        return self.session.query(RoleProfileORM).filter(
            RoleProfileORM.rank_id == rank_id,
            RoleProfileORM.deleted == False,
        ).count()

    def count_associated_to_role(self, role_id: int) -> int:
        return self.session.query(RoleProfileORM).filter(
            RoleProfileORM.role_id == role_id,
            RoleProfileORM.deleted == False,
        ).count()

    def delete_by_role_id(self, role_id: int) -> list[int]:
        role_profiles = self.session.query(RoleProfileORM).filter(
            RoleProfileORM.role_id == role_id,
            RoleProfileORM.deleted == False,
        ).all()
        if not role_profiles:
            return []
        affected_game_profile_ids = list({rp.game_profile_id for rp in role_profiles})
        for role_profile in role_profiles:
            self.session.delete(role_profile)
        self.session.flush()
        return affected_game_profile_ids

    def count_by_game_profile_id(self, game_profile_id: int) -> int:
        return self.session.query(RoleProfileORM).filter(
            RoleProfileORM.game_profile_id == game_profile_id,
            RoleProfileORM.deleted == False,
        ).count()

    def get_rank_usage(
        self,
        videogame_id: Optional[int],
        start_date: Optional[datetime],
        end_date: Optional[datetime],
    ) -> list[tuple['Rank', int]]:
        """
        Devuelve cada rango junto con la cantidad de jugadores (perfiles de juego distintos) que lo
        tienen asignado, opcionalmente acotado a un videojuego y a un rango de fechas de creación de
        los perfiles. Si no se especifica videojuego, se consideran los rangos de todos los videojuegos.
        """
        query = (
            self.session.query(
                RankORM,
                func.count(func.distinct(RoleProfileORM.game_profile_id)),
            )
            .join(RoleProfileORM, RoleProfileORM.rank_id == RankORM.rank_id)
            .join(GameProfileORM, GameProfileORM.game_profile_id == RoleProfileORM.game_profile_id)
            .filter(
                RankORM.deleted.is_(False),
                RankORM.videogame.has(deleted=False),
                RoleProfileORM.deleted.is_(False),
                GameProfileORM.deleted.is_(False),
                GameProfileORM.user.has(deleted=False),
            )
        )

        if videogame_id is not None:
            query = query.filter(RankORM.videogame_id == videogame_id)
        if start_date is not None:
            query = query.filter(GameProfileORM.created_at >= start_date)
        if end_date is not None:
            query = query.filter(GameProfileORM.created_at <= end_date)

        query = query.options(selectinload(RankORM.videogame))
        rows = query.group_by(RankORM.rank_id).all()
        return [(RankMapper.orm_to_domain(rank), int(count)) for rank, count in rows]


    def soft_delete_by_role_id(self, role_id: int) -> list[int]:
        role_profiles = self.session.query(RoleProfileORM).filter(
            RoleProfileORM.role_id == role_id,
            RoleProfileORM.deleted == False,
        ).all()
        if not role_profiles:
            return []
        affected_game_profile_ids = list({rp.game_profile_id for rp in role_profiles})
        for role_profile in role_profiles:
            role_profile.deleted = True
        self.session.flush()
        return affected_game_profile_ids

    def soft_delete_by_game_profile_id(self, game_profile_id: int) -> int:
        updated = self.session.query(RoleProfileORM).filter(
            RoleProfileORM.game_profile_id == game_profile_id,
            RoleProfileORM.deleted == False,
        ).update({RoleProfileORM.deleted: True}, synchronize_session='fetch')
        self.session.flush()
        return updated

    def soft_delete_by_game_profile_ids(self, game_profile_ids: list[int]) -> int:
        if not game_profile_ids:
            return 0
        updated = self.session.query(RoleProfileORM).filter(
            RoleProfileORM.game_profile_id.in_(game_profile_ids),
            RoleProfileORM.deleted == False,
        ).update({RoleProfileORM.deleted: True}, synchronize_session='fetch')
        self.session.flush()
        return updated