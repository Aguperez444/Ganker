from app.domain.models.rank import Rank
from app.infrastructure.database.mappers.videogame_mapper import VideogameMapper
from app.infrastructure.database.models.rank_orm import RankORM

class RankMapper:
    @staticmethod
    def orm_to_domain(rank_orm: RankORM) -> Rank:
        return Rank(
            rank_id = rank_orm.rank_id,
            name = rank_orm.name,
            value = rank_orm.value,
            videogame = VideogameMapper.orm_to_domain(rank_orm.videogame),
            icon_url= rank_orm.icon_url
        )

    @staticmethod
    def domain_to_orm(rank: Rank) -> RankORM:
        return RankORM(
            rank_id = rank.rank_id,
            name = rank.name,
            value = rank.value,
            videogame_id = rank.videogame.videogame_id,
            icon_url = rank.icon_url
        )