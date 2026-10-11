from typing import List, Optional, TYPE_CHECKING
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.specifications.base import Specification
from app.domain.specifications.ranks_specification import ByRanksSpecification
from app.domain.specifications.regions_specification import ByRegionsSpecification
from app.domain.specifications.roles_specification import ByRolesSpecification
from app.domain.specifications.team.is_active_specification import ByIsActiveSpecification
from app.domain.specifications.team.search_terms_specification import BySearchTermsSpecification
from app.domain.specifications.team.vacant_slots_specification import ByVacantSlotsSpecification
from app.domain.specifications.videogame_specification import ByVideogameSpecification
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
                user_id: Optional[int] = None, limit: int = 5, offset: int = 0) -> List[TeamSummaryResponse]:
        """
        Busca equipos activos con vacantes. Si se recibe user_id, cada equipo indica si ese jugador cumple los requisitos para unirse.
        """
        with self._uow as uow:
            viewer: 'User|None' = None
            viewer_in_other_team: bool = False
            if user_id is not None:
                viewer = CatalogValidationService.get_and_validate_exist_user(user_id, uow)
                viewer_in_other_team = uow.team_repo.is_user_in_any_active_team(user_id) if viewer is not None else False

            specs: list[Specification] = [ByIsActiveSpecification(True)]

            if videogame_id:
                CatalogValidationService.get_and_validate_exist_videogame(videogame_id, uow)
                specs.append(ByVideogameSpecification(videogame_id))
            if region_id:
                CatalogValidationService.get_and_validate_exist_region(region_id, uow)
                specs.append(ByRegionsSpecification([region_id]))
            if rank_id:
                CatalogValidationService.get_and_validate_exist_rank(rank_id, uow)
                specs.append(ByRanksSpecification([rank_id]))
            if vacant_slots:
                specs.append(ByVacantSlotsSpecification(vacant_slots))
            if role_id:
                CatalogValidationService.get_and_validate_exist_role(role_id, uow)
                specs.append(ByRolesSpecification([role_id]))
            if search:
                specs.append(BySearchTermsSpecification(search))

            # Combino los filtros
            combined_spec = specs[0]
            for spec in specs[1:]:
                combined_spec = combined_spec & spec

            teams = uow.find_by_specification_repo.get_teams(combined_spec, offset, limit)

            return [CreateTeamSummaryService.create_team_summary(team, viewer, viewer_in_other_team) for team in teams]
