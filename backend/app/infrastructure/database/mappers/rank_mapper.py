from app.domain.models.rank import Rank
from app.infrastructure.database.mappers.videogame_mapper import VideogameMapper
from app.infrastructure.database.models.rankORM import RankORM

class RankMapper:
    @staticmethod
    def ORM_to_Domain(rankORM):
        return Rank(
            rank_id = rankORM.rank_id,
            name = rankORM.name,
            value = rankORM.value,
            videogame = VideogameMapper.ORM_to_Domain(rankORM.videogame)
        )

    @staticmethod
    def Domain_to_ORM(rank):
        return RankORM(
            rank_id = rank.id,
            name = rank.name,
            value = rank.value,
            videogame_id = rank.videogame_id
        )