from app.domain.models.videogame import Videogame
from app.infrastructure.database.models.videogameORM import VideogameORM

class VideogameMapper:

    @staticmethod
    def ORM_to_Domain(videogameORM):
        return Videogame(
            videogame_id = videogameORM.videogame_id,
            name = videogameORM.name
        )

    @staticmethod
    def Domain_to_ORM(videogame):
        return VideogameORM(
            videogame_id = videogame.id,
            name = videogame.name,
        )