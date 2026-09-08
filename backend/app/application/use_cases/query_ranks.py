from typing import cast

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.response.get_ranks_response import GetRanksResponse
from app.infrastructure.api.dto.response.base_classes.rank_object_response import RankObjectResponse


class QueryRanks:
    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def get_by_game_id(self, game_id: int) -> GetRanksResponse:
        with self.uow as uow:
            ranks = uow.rank_repo.get_ranks_by_game_id(game_id)

        ranks_response = [RankObjectResponse(rank_id=cast(int, rank.rank_id), name=rank.name, value=rank.value, icon_url=rank.icon_url or "Sin icono") for rank in ranks]

        return GetRanksResponse(ranks=ranks_response)


