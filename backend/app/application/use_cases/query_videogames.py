from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.response.base_classes.videogame_object_response import VideogameObjectResponse
from app.infrastructure.api.dto.response.get.get_videogames_response import GetVideogamesResponse


class QueryVideogames:
    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def get_all_videogames(self) -> GetVideogamesResponse:
        with self.uow as uow:
            videogames = uow.videogame_repo.get_all_videogames()
            videogames_response = [
                VideogameObjectResponse(
                    id=game.videogame_id,
                    name=game.name,
                    icon_url=game.icon_url or "Sin icono",
                    rank_per_role=game.rank_per_role,
                )
                for game in videogames
            ]
            return GetVideogamesResponse(videogames=videogames_response)


