from typing import TYPE_CHECKING, Optional
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.team.team_not_found_exception import TeamNotFoundException
from app.domain.exceptions.team.team_not_active_exception import TeamNotActiveException
from app.domain.exceptions.team.user_not_team_leader_exception import UserNotTeamLeaderException
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.services.create_team_summary_service import CreateTeamSummaryService
from app.infrastructure.api.dto.request.update_team_request import UpdateTeamRequest
from app.infrastructure.api.dto.response.team_summary import UpdateTeamResponse

if TYPE_CHECKING:
    from app.domain.models.team import Team


class UpdateTeam:
    def __init__(self, uow: IUnitOfWork):
        self._uow = uow

    def execute(self, team_id: int, user_id: int, request: UpdateTeamRequest) -> UpdateTeamResponse:
        with self._uow as uow:
            current_user = CatalogValidationService.get_and_validate_exist_user(user_id, uow)

            target_team: Optional['Team'] = uow.team_repo.get_by_id_for_update(team_id)
            if not target_team:
                raise TeamNotFoundException(team_id)

            if not target_team.is_active:
                raise TeamNotActiveException(team_id)

            if not target_team.is_leader(user_id):
                raise UserNotTeamLeaderException(user_id, team_id)

            min_rank = CatalogValidationService.get_and_validate_exist_rank(request.min_rank_id, uow)
            max_rank = CatalogValidationService.get_and_validate_exist_rank(request.max_rank_id, uow)

            region = None
            if request.region_id is not None:
                region = CatalogValidationService.get_and_validate_exist_region(request.region_id, uow)

            target_team.update_information(
                name=request.name,
                description=request.description,
                allow_other_regions=request.allow_other_regions,
                region=region,
                min_rank=min_rank,
                max_rank=max_rank,
            )

            updated_team = uow.team_repo.update_team(target_team)

            summary = CreateTeamSummaryService.create_team_summary(updated_team, viewer=current_user)
            return UpdateTeamResponse(
                status="success",
                message=f"El equipo {updated_team.name} ha sido modificado exitosamente",
                data=summary,
            )
