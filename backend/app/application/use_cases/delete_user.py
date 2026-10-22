from typing import Optional

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.domain_exception import DomainException
from app.domain.exceptions.user.user_not_found_exception import UserNotFoundException
from app.domain.models.user_role import UserRole
from app.infrastructure.api.dto.response.delete.delete_user_response import DeleteUserResponse


class DeleteUserUseCase:
    def __init__(self, uow: IUnitOfWork):
        self.uow: IUnitOfWork = uow

    def execute(
        self,
        target_user_id: int,
        requester_id: Optional[int] = None,
        requester_role: Optional[UserRole] = None,
    ) -> DeleteUserResponse:
        with self.uow as uow:
            target_user = uow.user_repo.get_user_by_id(target_user_id)
            if not target_user:
                raise UserNotFoundException(target_user_id)

            effective_requester_id = requester_id if requester_id is not None else target_user_id

            if effective_requester_id != target_user_id:
                role = requester_role
                if role is None:
                    requester = uow.user_repo.get_user_by_id(effective_requester_id)
                    if not requester:
                        raise UserNotFoundException(effective_requester_id)
                    role = requester.role
                # TODO Crear exceptions para estos casos y no usar DomainException genérica
                if role not in (UserRole.ADMIN, UserRole.OWNER):
                    raise DomainException(
                        message="No tienes permisos suficientes para eliminar este usuario.",
                        status_code=403,
                    )

                if role == UserRole.ADMIN and target_user.role == UserRole.OWNER:
                    raise DomainException(
                        message="Un administrador no tiene permisos para eliminar a un propietario.",
                        status_code=403,
                    )

            # En cascada, marcar deleted = True en todos sus GameProfile asociados y sus relaciones
            affected_profile_ids = uow.game_profile_repo.soft_delete_by_player_id(target_user_id)
            if affected_profile_ids:
                uow.role_profile_repo.soft_delete_by_game_profile_ids(affected_profile_ids)
                uow.character_priority_repo.soft_delete_by_game_profile_ids(affected_profile_ids)

            # Invalidar / revocar sesiones y tokens activos del usuario
            if getattr(uow, "refresh_token_repo", None) is not None:
                uow.refresh_token_repo.revoke_all_by_user_id(target_user_id)

            if getattr(uow, "reset_token_repo", None) is not None:
                uow.reset_token_repo.invalidate_all_user_tokens(target_user_id)

            if getattr(uow, "discord_account_link_repo", None) is not None:
                uow.discord_account_link_repo.delete_by_user_id(target_user_id)

            if getattr(uow, "federated_identity_repo", None) is not None:
                uow.federated_identity_repo.delete_by_user_id(target_user_id)

            # Marcar deleted = True en el usuario
            uow.user_repo.soft_delete_user(target_user_id)

        return DeleteUserResponse(message="El usuario ha sido eliminado exitosamente.")


DeleteUser = DeleteUserUseCase
