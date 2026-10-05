from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.team.team_not_found_exception import TeamNotFoundException
from app.domain.exceptions.team.user_already_in_team_exception import UserAlreadyInTeamException
from app.domain.services.catalog_validation_service import CatalogValidationService

from typing import TYPE_CHECKING

from app.domain.services.create_team_summary_service import CreateTeamSummaryService
from app.infrastructure.api.dto.response.team_summary import JoinTeamResponse

if TYPE_CHECKING:
    from app.domain.models.team import Team


class JoinTeam:
    def __init__(self, uow: IUnitOfWork):
        self._uow = uow

    def execute(self, target_team_id: int, user_id: int, target_team_member_role_id: int) -> JoinTeamResponse:
        with self._uow as uow:
            # Antes de empezar, verificar que el usuario exista
            current_user = CatalogValidationService.get_and_validate_exist_user(user_id, uow)

            # 1. Obtenemos el target_team con bloqueo FOR UPDATE para evitar colisiones
            target_team: 'Team|None' = uow.team_repo.get_by_id_for_update(target_team_id)
            if not target_team:
                raise TeamNotFoundException(target_team_id)

            # 2. El jugador no puede formar parte de otro equipo activo
            if not target_team.has_member(user_id) and uow.team_repo.is_user_in_any_active_team(user_id):
                raise UserAlreadyInTeamException(user_id)

            # 3. Agregamos el miembro al equipo (esto ejecuta todas las validaciones de negocio necesarias para saber si el jugador cumple los requisitos del equipo)
            target_team.add_member(current_user, target_team_member_role_id)

            # 4. Persistimos la unión
            updated_team = uow.team_repo.update_team_members(target_team)

            # informamos de la unión al usuario
            summary = CreateTeamSummaryService.create_team_summary(updated_team, viewer=current_user)
            return JoinTeamResponse(
                message=f"Te uniste al equipo {updated_team.name}",
                chatroom_id=updated_team.conversation.conversation_id,
                data=summary
            )
