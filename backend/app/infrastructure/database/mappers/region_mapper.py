from app.infrastructure.database.mappers.videogame_mapper import VideogameMapper
from app.infrastructure.database.models.region_orm import RegionORM
from app.domain.models.region import Region


class RegionMapper:
    @staticmethod
    def orm_to_domain(region_orm: RegionORM) -> Region:
        return Region(
            region_id = region_orm.region_id,
            name = region_orm.name,
            videogame = VideogameMapper.orm_to_domain(region_orm.videogame),
        )

    @staticmethod
    def domain_to_orm(region: Region) -> RegionORM:
        if not region.is_persisted():
            return RegionORM(
                name = region.name,
                videogame = VideogameMapper.domain_to_orm(region.videogame)
            )

        return RegionORM(
            region_id = region.region_id,
            name = region.name,
            videogame = VideogameMapper.domain_to_orm(region.videogame),
        )