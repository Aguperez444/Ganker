from typing import cast

from app.application.ports.i_unit_of_work import IUnitOfWork

from app.infrastructure.api.dto.response.get_videogames_response import GetVideogamesResponse
from app.infrastructure.api.dto.response.base_classes.videogame_object_response import VideogameObjectResponse


class QueryVideogames:
    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def get_all_videogames(self) -> GetVideogamesResponse:
        with self.uow as uow:
            videogames = uow.videogame_repo.get_all_videogames()
            videogames_response = [
                VideogameObjectResponse(
                    id=cast(int, game.videogame_id),
                    name=game.name,
                    icon_url=game.icon_url or "Sin icono",
                    rank_per_role=game.rank_per_role,
                )
                for game in videogames
            ]
            return GetVideogamesResponse(videogames=videogames_response)


