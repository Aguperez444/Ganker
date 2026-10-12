from dataclasses import dataclass
from typing import TYPE_CHECKING, Optional, List
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.application.ports.i_storage_service import IStorageService
from app.domain.exceptions.team.team_not_found_exception import TeamNotFoundException
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.infrastructure.api.dto.response.delete.delete_team_response import DeleteTeamResponse

if TYPE_CHECKING:
    from app.domain.models.team import Team


@dataclass
class DeleteTeamResult:
    response: DeleteTeamResponse
    member_user_ids: List[int]
    team_name: str
    conversation_id: Optional[int]


class DeleteTeam:
    def __init__(self, uow: IUnitOfWork, storage_service: Optional[IStorageService] = None):
        self._uow = uow
        self._storage_service = storage_service

    def execute(self, team_id: int, user_id: int) -> DeleteTeamResult:
        with self._uow as uow:
            CatalogValidationService.get_and_validate_exist_user(user_id, uow)

            target_team: Optional['Team'] = uow.team_repo.get_by_id_for_update(team_id)
            if not target_team:
                raise TeamNotFoundException(team_id)

            active_member_user_ids = [
                m.user.user_id for m in target_team.members if m.user is not None
            ]
            team_name = target_team.name
            icon_url = target_team.icon_url
            conversation_id = (
                target_team.conversation.conversation_id
                if target_team.conversation and target_team.conversation.is_persisted()
                else None
            )

            target_team.delete_team(requester_id=user_id)

            uow.team_repo.delete_team(target_team)

            if self._storage_service and icon_url and "default_icon" not in icon_url:
                try:
                    self._storage_service.delete_file(icon_url)
                except Exception:
                    from colorama import Fore, Style
                    print(Fore.RED + "-" * 70 + "\n" + f"Error inesperado al borrar la imagen del equipo: {icon_url} \n" + "-" * 70 + "\n" + Style.RESET_ALL)

            return DeleteTeamResult(
                response=DeleteTeamResponse(
                    status="success",
                    message="El equipo fue disuelto exitosamente."
                ),
                member_user_ids=active_member_user_ids,
                team_name=team_name,
                conversation_id=conversation_id
            )
