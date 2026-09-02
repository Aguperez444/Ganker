from typing import TYPE_CHECKING, Optional

from app.infrastructure.database.models.rank_orm import RankORM
from app.infrastructure.database.mappers.rank_mapper import RankMapper
from app.application.ports.i_rank_repository import IRankRepository


if TYPE_CHECKING:
    from app.domain.models.rank import Rank

class RankRepositoryImpl(IRankRepository):
    def __init__(self, session):
        self.session = session

    def get_rank_by_id(self, rank_id: int) -> Optional['Rank']:
        found = self.session.query(RankORM).filter(RankORM.rank_id == rank_id).first()
        domain_found = RankMapper.orm_to_domain(found) if found else None
        return domain_found