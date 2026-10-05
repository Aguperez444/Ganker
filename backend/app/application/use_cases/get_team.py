from typing import Optional

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.team.team_not_found_exception import TeamNotFoundException
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.services.create_team_summary_service import CreateTeamSummaryService
from app.infrastructure.api.dto.response.team_summary import TeamSummaryResponse


class GetTeam:
    """Obtiene la vista de un equipo (por ID, o el equipo activo del propio jugador)."""

    def __init__(self, uow: IUnitOfWork):
        self._uow = uow

    def by_id(self, team_id: int, user_id: int) -> TeamSummaryResponse:
        with self._uow as uow:
            viewer = CatalogValidationService.get_and_validate_exist_user(user_id, uow)
            team = uow.team_repo.get_by_id(team_id)
            if not team:
                raise TeamNotFoundException(team_id)
            viewer_in_other_team = (not team.has_member(user_id)) and uow.team_repo.is_user_in_any_active_team(user_id)
            return CreateTeamSummaryService.create_team_summary(team, viewer, viewer_in_other_team)

    def my_active_team(self, user_id: int) -> Optional[TeamSummaryResponse]:
        """Retorna el equipo activo del jugador, o None si no pertenece a ninguno."""
        with self._uow as uow:
            viewer = CatalogValidationService.get_and_validate_exist_user(user_id, uow)
            team = uow.team_repo.get_active_team_by_user_id(user_id)
            if not team:
                return None
            return CreateTeamSummaryService.create_team_summary(team, viewer)
