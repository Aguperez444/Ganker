from typing import Optional

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.game_profile.does_not_belong_to_profile_exception import DoesNotBelongToProfileException
from app.domain.exceptions.game_profile.game_profile_not_found_exception import GameProfileNotFoundException
from app.domain.models.user_role import UserRole
from app.infrastructure.api.dto.response.delete.delete_game_profile_response import DeleteGameProfileResponse


class DeleteGameProfileUseCase:
    def __init__(self, uow: IUnitOfWork):
        self.uow: IUnitOfWork = uow

    def execute(
        self,
        game_profile_id: int,
        player_id: Optional[int] = None,
        requester_role: Optional[UserRole] = None,
    ) -> DeleteGameProfileResponse:
        with self.uow as uow:
            game_profile = uow.game_profile_repo.get_game_profile_by_id(game_profile_id)
            if not game_profile:
                raise GameProfileNotFoundException(game_profile_id)

            if player_id is not None and game_profile.player_id != player_id:
                if requester_role not in (UserRole.ADMIN, UserRole.OWNER):
                    raise DoesNotBelongToProfileException("perfil de juego", f"{game_profile_id}")

            # En cascada, marcar deleted = True en sus relaciones de roles x rangos y prioridades de personajes
            uow.role_profile_repo.soft_delete_by_game_profile_id(game_profile_id)
            uow.character_priority_repo.soft_delete_by_game_profile_id(game_profile_id)

            # Marcar deleted = True en el perfil de juego
            uow.game_profile_repo.soft_delete_game_profile(game_profile_id)

        return DeleteGameProfileResponse(message="El perfil de juego ha sido eliminado exitosamente.")


DeleteGameProfile = DeleteGameProfileUseCase
