from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.user.user_not_found_exception import UserNotFoundException
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.services.create_discord_dto_service import CreateDiscordDTOService
from app.domain.services.discord_visibility_service import DiscordVisibilityService
from app.infrastructure.api.dto.response.get.get_discord_account_response import GetDiscordAccountResponse


class QueryDiscordAccount:
    """Discord de un jugador, solo si quien consulta puede verlo según la visibilidad que eligió el dueño."""

    def __init__(self, uow: IUnitOfWork):
        self.uow: IUnitOfWork = uow

    def execute(self, owner_id: int, viewer_id: int) -> GetDiscordAccountResponse:
        with self.uow as uow:
            owner = CatalogValidationService.get_and_validate_exist_user(owner_id, uow)
            if getattr(owner, "banned", False) is True:
                raise UserNotFoundException(owner_id)

            link = uow.discord_account_link_repo.get_by_user_id(owner_id)
            if link is None:
                return CreateDiscordDTOService.not_visible()

            owner_team = uow.team_repo.get_active_team_by_user_id(owner_id) if viewer_id != owner_id else None
            if not DiscordVisibilityService.can_view(link, viewer_id, owner_team):
                return CreateDiscordDTOService.not_visible()

        return CreateDiscordDTOService.create_response(link, for_owner=viewer_id == owner_id)
