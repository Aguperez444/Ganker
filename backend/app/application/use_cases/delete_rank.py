from typing import cast

from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.rank.rank_not_found_exception import RankNotFoundException
from app.infrastructure.api.dto.response.delete_rank_response import DeleteRankResponse
from app.domain.exceptions.rank.cannot_delete_rank_exception import CannotDeleteRankException


class DeleteRank:
    def __init__(self, storage_service: IStorageService, uow: IUnitOfWork):
        self.storage_service: IStorageService = storage_service
        self.uow: IUnitOfWork = uow

    def execute(self, rank_id: int) -> DeleteRankResponse:
        with self.uow as uow:
            rank_to_delete = uow.rank_repo.get_rank_by_id(rank_id)
            if not rank_to_delete:
                raise RankNotFoundException(rank_id)

            # Validar si existen jugadores o perfiles asociados actualmente al rango
            associated_count = uow.rank_repo.count_associated_profiles(rank_id)
            if associated_count > 0:
                game_id = rank_to_delete.videogame.videogame_id
                all_game_ranks = uow.rank_repo.get_ranks_by_game_id(cast(int,game_id))
                other_ranks = [r for r in all_game_ranks if r.rank_id != rank_id]

                if not other_ranks:
                    raise CannotDeleteRankException(rank_id)

                # Buscar el rango inmediatamente inferior (si este existe, al inmediatamente superior en caso contrario)
                inferior_ranks = [r for r in other_ranks if r.value < rank_to_delete.value]
                if inferior_ranks:
                    target_rank = max(inferior_ranks, key=lambda r: r.value)
                else:
                    superior_ranks = [r for r in other_ranks if r.value > rank_to_delete.value]
                    if superior_ranks:
                        target_rank = min(superior_ranks, key=lambda r: r.value)
                    else:
                        target_rank = other_ranks[0]

                # Actualizar los perfiles asociados para que apunten al rango seleccionado
                uow.rank_repo.reassign_associated_profiles(
                    source_rank_id=rank_id,
                    target_rank_id=cast(int, target_rank.rank_id)
                )

            # Eliminar el rango del sistema
            uow.rank_repo.delete_rank(rank_id)

            # Limpiar archivo de ícono en almacenamiento si existe
            if rank_to_delete.icon_url:
                self.storage_service.delete_file(rank_to_delete.icon_url)

        return DeleteRankResponse(message="El rango ha sido eliminado exitosamente.")
