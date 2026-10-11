from typing import List, Optional, TYPE_CHECKING
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.response.team_summary import TeamSummaryResponse
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.services.create_team_summary_service import CreateTeamSummaryService

if TYPE_CHECKING:
    from app.domain.models.user import User

class SearchTeams:
    def __init__(self, uow: IUnitOfWork):
        self._uow = uow

    def execute(self, videogame_id: Optional[int] = None, region_id: Optional[int] = None,
                rank_id: Optional[int] = None, vacant_slots: Optional[int] = None,
                role_id: Optional[int] = None, search: Optional[str] = None,
                user_id: Optional[int] = None, limit: Optional[int] = None, offset: int = 0) -> List[TeamSummaryResponse]:
        """
        Busca equipos activos con vacantes. Si se recibe user_id, cada equipo indica si ese jugador cumple los requisitos para unirse.
        """
        with self._uow as uow:
            viewer: 'User|None' = None
            viewer_in_other_team: bool = False
            if user_id is not None:
                viewer = CatalogValidationService.get_and_validate_exist_user(user_id, uow)
                viewer_in_other_team = uow.team_repo.is_user_in_any_active_team(user_id) if viewer is not None else False

            teams = uow.team_repo.search_teams(
                videogame_id=videogame_id,
                region_id=region_id,
                rank_id=rank_id,
                vacant_slots=vacant_slots,
                role_id=role_id,
                search_term=search,
                limit=limit,
                offset=offset
            )
            return [CreateTeamSummaryService.create_team_summary(team, viewer, viewer_in_other_team) for team in teams]
