from app.domain.models.videogame import Videogame
from app.infrastructure.database.models.videogame_orm import VideogameORM

class VideogameMapper:

    @staticmethod
    def orm_to_domain(videogame_orm: VideogameORM) -> Videogame:
        return Videogame(
            videogame_id = videogame_orm.videogame_id,
            name = videogame_orm.name,
            icon_url = videogame_orm.icon_url,
            rank_per_role = videogame_orm.rank_per_role
        )

    @staticmethod
    def domain_to_orm(videogame: Videogame) -> VideogameORM:
        return VideogameORM(
            videogame_id = videogame.videogame_id,
            name = videogame.name,
            icon_url = videogame.icon_url,
            rank_per_role = videogame.rank_per_role
        )