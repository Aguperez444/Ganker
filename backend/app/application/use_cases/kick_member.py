from typing import TYPE_CHECKING, Optional
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.team.team_not_found_exception import TeamNotFoundException
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.services.create_team_summary_service import CreateTeamSummaryService
from app.infrastructure.api.dto.response.team_summary import KickMemberResponse

if TYPE_CHECKING:
    from app.domain.models.team import Team


class KickMember:
    def __init__(self, uow: IUnitOfWork):
        self._uow = uow

    def execute(self, team_id: int, leader_id: int, target_user_id: int) -> KickMemberResponse:
        with self._uow as uow:
            leader_user = CatalogValidationService.get_and_validate_exist_user(leader_id, uow)
            target_user = CatalogValidationService.get_and_validate_exist_user(target_user_id, uow)

            target_team: Optional['Team'] = uow.team_repo.get_by_id_for_update(team_id)
            if not target_team:
                raise TeamNotFoundException(team_id)

            target_team.kick_member(requester_id=leader_id, target_user_id=target_user_id)

            updated_team = uow.team_repo.update_team_members(target_team)

            summary = CreateTeamSummaryService.create_team_summary(updated_team, viewer=leader_user)
            return KickMemberResponse(
                status="success",
                message=f"El jugador {target_user.username} fue expulsado exitosamente del equipo",
                data=summary
            )
