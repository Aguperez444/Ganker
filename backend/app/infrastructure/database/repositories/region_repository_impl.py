from typing import Optional

from sqlalchemy import func

from app.application.ports.i_region_repository import IRegionRepository
from app.infrastructure.database.mappers.region_mapper import RegionMapper
from app.infrastructure.database.models.region_orm import RegionORM
from app.domain.models.region import Region


class RegionRepositoryImpl(IRegionRepository):
    def __init__(self, session):
        self.session = session

    def get_region_by_id(self, region_id: int) -> Optional['Region']:
        found = self.session.query(RegionORM).filter(RegionORM.region_id == region_id).first()
        domain_found = RegionMapper.orm_to_domain(found) if found else None
        return domain_found

    def get_regions_by_game_id(self, game_id: int) -> list['Region']:
        found = self.session.query(RegionORM).filter(RegionORM.videogame_id == game_id)
        domain_found = [RegionMapper.orm_to_domain(region) for region in found]
        return domain_found

    def get_region_by_name_and_videogame(self, name: str, videogame_id: int) -> Optional['Region']:
        found = self.session.query(RegionORM).filter(
            func.lower(RegionORM.name) == func.lower(name.strip()),
            RegionORM.videogame_id == videogame_id
        ).first()
        domain_found = RegionMapper.orm_to_domain(found) if found else None
        return domain_found

    def save_region(self, region: 'Region') -> 'Region':
        orm_region = RegionMapper.domain_to_orm(region)
        self.session.add(orm_region)
        self.session.flush()
        self.session.refresh(orm_region)
        return RegionMapper.orm_to_domain(orm_region)

    def update_region(self, region: 'Region') -> 'Region':
        orm_region = self.session.query(RegionORM).filter(RegionORM.region_id == region.region_id).first()
        if orm_region:
            orm_region.name = region.name
            orm_region.videogame_id = region.videogame.videogame_id
            self.session.flush()
            self.session.refresh(orm_region)
            return RegionMapper.orm_to_domain(orm_region)
        return region


    def delete_region(self, region_id: int) -> bool:
        orm_region = self.session.query(RegionORM).filter(RegionORM.region_id == region_id).first()
        if orm_region:
            self.session.delete(orm_region)
            self.session.flush()
            return True
        return False

    def count_associated_to_region(self, region_id) -> int:

        return self.session.query(RegionORM).filter(RegionORM.region_id == region_id).count()
