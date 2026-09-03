
from app.application.ports.i_unit_of_work import IUnitOfWork

from app.infrastructure.api.dto.get_videogames_response import GetVideogamesResponse
from app.infrastructure.api.dto.videogame_object_response import VideogameObjectResponse


class QueryVideogames:
    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def get_all_videogames(self) -> GetVideogamesResponse:
        with self.uow as uow:
            videogames = uow.videogame_repo.get_all_videogames()
            videogames_response=[VideogameObjectResponse(id=game.videogame_id,name=game.name) for game in videogames]
            return GetVideogamesResponse(videogames=videogames_response)


