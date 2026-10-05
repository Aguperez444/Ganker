from typing import List, Optional
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.response.team_summary import TeamSummaryResponse
from app.domain.services.create_team_summary_service import CreateTeamSummaryService

class SearchTeams:
    def __init__(self, uow: IUnitOfWork):
        self._uow = uow

    def execute(self, videogame_id: Optional[int] = None, region_id: Optional[int] = None, 
                rank_id: Optional[int] = None, vacant_slots: Optional[int] = None, 
                role_id: Optional[int] = None, search: Optional[str] = None) -> List[TeamSummaryResponse]:
        with self._uow as uow:
            teams = uow.team_repo.search_teams(
                videogame_id=videogame_id,
                region_id=region_id,
                rank_id=rank_id,
                vacant_slots=vacant_slots,
                role_id=role_id,
                search_term=search
            )
            return [CreateTeamSummaryService.create_team_summary(team) for team in teams]
