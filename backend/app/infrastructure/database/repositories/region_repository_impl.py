from typing import TYPE_CHECKING, Optional

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.application.ports.i_region_repository import IRegionRepository
from app.infrastructure.database.mappers.region_mapper import RegionMapper
from app.infrastructure.database.models.region_orm import RegionORM


if TYPE_CHECKING:
    from app.domain.models.region import Region

#TODO REVISAR ESTO, NO ESTOY SEGURO DE HASTA QUE PUNTO ESTO DEVUELVE NONE REALMENTE

class RegionRepositoryImpl(IRegionRepository):
    def __init__(self, session: Session):
        self.session = session

    def get_region_by_id(self, region_id: int) -> Optional['Region']:
        found = self.session.query(RegionORM).filter(
            RegionORM.region_id == region_id,
            RegionORM.deleted == False,
        ).first()
        if found and found.videogame and getattr(found.videogame, "deleted", False):
            return None
        domain_found = RegionMapper.orm_to_domain(found) if found else None
        return domain_found

    def get_regions_by_game_id(self, game_id: int) -> list[Region]:
        found = self.session.query(RegionORM).filter(
            RegionORM.videogame_id == game_id,
            RegionORM.deleted == False,
        ).all()
        domain_found = [
            RegionMapper.orm_to_domain(region)
            for region in found
            if not (region.videogame and getattr(region.videogame, "deleted", False))
        ]
        return domain_found

    def get_region_by_name_and_videogame(self, name: str, videogame_id: int) -> Optional['Region']:
        found = self.session.query(RegionORM).filter(
            func.lower(RegionORM.name) == func.lower(name.strip()),
            RegionORM.videogame_id == videogame_id,
            RegionORM.deleted == False,
        ).first()
        if found and found.videogame and getattr(found.videogame, "deleted", False):
            return None
        domain_found = RegionMapper.orm_to_domain(found) if found else None
        return domain_found

    def save_region(self, region: 'Region') -> 'Region | None':
        orm_region = RegionMapper.domain_to_orm(region)
        self.session.add(orm_region)
        self.session.flush()
        self.session.refresh(orm_region)
        return RegionMapper.orm_to_domain(orm_region)

    def update_region(self, region: 'Region') -> 'Region | None':
        orm_region = self.session.query(RegionORM).filter(
            RegionORM.region_id == region.region_id,
            RegionORM.deleted == False,
        ).first()
        if orm_region:
            orm_region.name = region.name
            orm_region.videogame_id = region.videogame.videogame_id
            self.session.flush()
            self.session.refresh(orm_region)
            return RegionMapper.orm_to_domain(orm_region)
        return None


    def delete_region(self, region_id: int) -> bool:
        orm_region = self.session.query(RegionORM).filter(RegionORM.region_id == region_id).first()
        if orm_region:
            self.session.delete(orm_region)
            self.session.flush()
            return True
        return False

    def count_associated_to_region(self, region_id) -> int:

        return self.session.query(RegionORM).filter(
            RegionORM.region_id == region_id,
            RegionORM.deleted == False,
        ).count()

    def soft_delete_by_videogame_id(self, videogame_id: int) -> int:
        updated = self.session.query(RegionORM).filter(
            RegionORM.videogame_id == videogame_id,
            RegionORM.deleted == False,
        ).update({RegionORM.deleted: True}, synchronize_session='fetch')
        self.session.flush()
        return updated
