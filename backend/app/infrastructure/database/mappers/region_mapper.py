from app.infrastructure.database.mappers.videogame_mapper import VideogameMapper
from app.infrastructure.database.models.region_orm import RegionORM
from app.domain.models.region import Region


class RegionMapper:
    @staticmethod
    def orm_to_domain(region_orm: RegionORM | None) -> Region | None:
        if region_orm is None:
            return None
        return Region(
            region_id = region_orm.region_id,
            name = region_orm.name,
            videogame = VideogameMapper.orm_to_domain(region_orm.videogame),
        )

    @staticmethod
    def domain_to_orm(region: Region | None) -> RegionORM | None:
        if region is None:
            return None
        if not region.is_persisted():
            return RegionORM(
                name = region.name,
                videogame_id = region.videogame.videogame_id
            )

        return RegionORM(
            region_id = region.region_id,
            name = region.name,
            videogame_id=region.videogame.videogame_id
        )