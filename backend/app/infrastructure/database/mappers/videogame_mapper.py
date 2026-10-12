from app.domain.models.videogame import Videogame
from app.infrastructure.database.models.videogame_orm import VideogameORM

class VideogameMapper:

    @staticmethod
    def orm_to_domain(videogame_orm: VideogameORM) -> Videogame:
        return Videogame(
            videogame_id = videogame_orm.videogame_id,
            name = videogame_orm.name,
            icon_url = videogame_orm.icon_url,
            rank_per_role = videogame_orm.rank_per_role,
            has_characters = videogame_orm.has_characters if videogame_orm.has_characters is not None else True
        )

    @staticmethod
    def domain_to_orm(videogame: Videogame) -> VideogameORM:
        if not videogame.is_persisted():
            return VideogameORM(
                name = videogame.name,
                icon_url = videogame.icon_url,
                rank_per_role = videogame.rank_per_role,
                has_characters = videogame.has_characters
            )
        return VideogameORM(
            videogame_id = videogame.videogame_id,
            name = videogame.name,
            icon_url = videogame.icon_url,
            rank_per_role = videogame.rank_per_role,
            has_characters = videogame.has_characters
        )