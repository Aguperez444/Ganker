from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.rank.cannot_delete_rank_exception import CannotDeleteRankException
from app.domain.exceptions.rank.rank_not_found_exception import RankNotFoundException
from app.infrastructure.api.dto.response.delete.delete_rank_response import DeleteRankResponse


class SoftDeleteRankUseCase:
    def __init__(self, uow: IUnitOfWork):
        self.uow: IUnitOfWork = uow

    def execute(self, rank_id: int) -> DeleteRankResponse:
        with self.uow as uow:
            rank_to_delete = uow.rank_repo.get_rank_by_id(rank_id)
            if not rank_to_delete:
                raise RankNotFoundException(rank_id)

            associated_count = uow.role_profile_repo.count_associated_to_rank(rank_id)
            if associated_count > 0:
                game_id = rank_to_delete.videogame.videogame_id
                all_game_ranks = uow.rank_repo.get_ranks_by_game_id(game_id)
                other_ranks = [r for r in all_game_ranks if r.rank_id != rank_id]

                if not other_ranks:
                    raise CannotDeleteRankException(rank_id)

                inferior_ranks = [r for r in other_ranks if r.value < rank_to_delete.value]
                if inferior_ranks:
                    target_rank = max(inferior_ranks, key=lambda r: r.value)
                else:
                    superior_ranks = [r for r in other_ranks if r.value > rank_to_delete.value]
                    if superior_ranks:
                        target_rank = min(superior_ranks, key=lambda r: r.value)
                    else:
                        target_rank = other_ranks[0]

                uow.role_profile_repo.reassign_associated_to_rank(
                    source_rank_id=rank_id,
                    target_rank_id=target_rank.rank_id,
                )

            uow.rank_repo.soft_delete_rank(rank_id)

        return DeleteRankResponse(message="El rango ha sido eliminado exitosamente.")


SoftDeleteRank = SoftDeleteRankUseCase
