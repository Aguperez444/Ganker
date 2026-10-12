from typing import TYPE_CHECKING, Optional
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.team.team_not_found_exception import TeamNotFoundException
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.services.create_team_summary_service import CreateTeamSummaryService
from app.infrastructure.api.dto.response.team_summary import DeactivateTeamResponse

if TYPE_CHECKING:
    from app.domain.models.team import Team


class DeactivateTeam:
    def __init__(self, uow: IUnitOfWork):
        self._uow = uow

    def execute(self, team_id: int, user_id: int) -> DeactivateTeamResponse:
        with self._uow as uow:
            current_user = CatalogValidationService.get_and_validate_exist_user(user_id, uow)

            target_team: Optional['Team'] = uow.team_repo.get_by_id_for_update(team_id)
            if not target_team:
                raise TeamNotFoundException(team_id)

            target_team.deactivate(requester_id=user_id)

            updated_team = uow.team_repo.deactivate_team(target_team)

            summary = CreateTeamSummaryService.create_team_summary(updated_team, viewer=current_user)
            return DeactivateTeamResponse(
                status="success",
                message="El equipo fue marcado inactivo exitosamente.",
                data=summary
            )
