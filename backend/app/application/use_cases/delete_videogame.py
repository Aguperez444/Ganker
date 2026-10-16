from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.infrastructure.api.dto.response.delete.delete_videogame_response import DeleteVideogameResponse


class DeleteVideogameUseCase:
    def __init__(self, uow: IUnitOfWork):
        self.uow = uow

    def execute(self, videogame_id: int) -> DeleteVideogameResponse:
        with self.uow as uow:
            CatalogValidationService.get_and_validate_exist_videogame(videogame_id, uow)

            # 1. En cascada, marcar deleted = True en todos los GameProfile vinculados a ese juego
            #    y en sus relaciones de roles x rangos (RoleProfile) y prioridades de personajes (CharacterPriority)
            affected_profile_ids = uow.game_profile_repo.soft_delete_by_videogame_id(videogame_id)
            if affected_profile_ids:
                uow.role_profile_repo.soft_delete_by_game_profile_ids(affected_profile_ids)
                uow.character_priority_repo.soft_delete_by_game_profile_ids(affected_profile_ids)

            # 2. En cascada, marcar deleted = True en todos sus roles, rangos, personajes y regiones asociados
            uow.role_repo.soft_delete_by_videogame_id(videogame_id)
            uow.rank_repo.soft_delete_by_videogame_id(videogame_id)
            uow.character_repo.soft_delete_by_videogame_id(videogame_id)
            if getattr(uow, "region_repo", None) is not None:
                uow.region_repo.soft_delete_by_videogame_id(videogame_id)

            # 3. Marcar deleted = True en el videojuego
            uow.videogame_repo.soft_delete_videogame(videogame_id)

        return DeleteVideogameResponse(message="El videojuego ha sido eliminado exitosamente.")


DeleteVideogame = DeleteVideogameUseCase
