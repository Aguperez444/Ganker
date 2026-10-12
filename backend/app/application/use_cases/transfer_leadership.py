from typing import TYPE_CHECKING
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.team.team_not_found_exception import TeamNotFoundException
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.services.create_team_summary_service import CreateTeamSummaryService
from app.infrastructure.api.dto.response.team_summary import TransferLeadershipResponse

if TYPE_CHECKING:
    from app.domain.models.team import Team


class TransferLeadership:
    def __init__(self, uow: IUnitOfWork):
        self._uow = uow

    def execute(self, team_id: int, requester_id: int,
                new_leader_id: int) -> TransferLeadershipResponse:

        with self._uow as uow:
            current_leader = CatalogValidationService.get_and_validate_exist_user(requester_id, uow)
            new_leader = CatalogValidationService.get_and_validate_exist_user(new_leader_id, uow)

            target_team: 'Team|None' = uow.team_repo.get_by_id_for_update(team_id)
            if not target_team:
                raise TeamNotFoundException(team_id)

            target_team.transfer_leadership(requester_id=requester_id, target_user_id=new_leader_id)

            updated_team = uow.team_repo.update_team_members(target_team)

            summary = CreateTeamSummaryService.create_team_summary(updated_team, viewer=current_leader)
            return TransferLeadershipResponse(
                status="success",
                message=f"El liderazgo del equipo fue transferido exitosamente a {new_leader.username}",
                data=summary
            )
