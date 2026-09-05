from typing import cast

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.get_player_response import GetPlayerResponse
from app.domain.exceptions.player_not_found_exception import PlayerNotFoundException
from app.domain.services.create_game_profile_dto_service import CreateGameProfileDTOService

class QueryPlayers:
    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def get_by_id(self, player_id: int) -> GetPlayerResponse:
        with self.uow as uow:
            #obtener el player de la base de datos usando el repositorio de players
            player = uow.player_repo.get_player_by_id(player_id)

            if player is None:
                raise PlayerNotFoundException(player_id)

            return GetPlayerResponse(
                username=player.username,
                name=player.name,
                mail=player.mail,
                profiles=[CreateGameProfileDTOService.create_game_profile(profile) for profile in player.profiles]
            )


