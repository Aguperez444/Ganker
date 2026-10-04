from typing import TYPE_CHECKING, Optional
from sqlalchemy.orm import Session
from app.application.ports.i_region_repository import IRegionRepository
from app.infrastructure.database.models.region_orm import RegionORM
from app.infrastructure.database.mappers.region_mapper import RegionMapper

if TYPE_CHECKING:
    from app.domain.models.region import Region

class RegionRepositoryImpl(IRegionRepository):
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, region_id: int) -> Optional['Region']:
        orm = self.session.query(RegionORM).filter(RegionORM.region_id == region_id).first()
        return RegionMapper.orm_to_domain(orm) if orm else None
