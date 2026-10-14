from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.riot.riot_account_not_linked_exception import RiotAccountNotLinkedException
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.infrastructure.api.dto.response.delete.delete_riot_account_link_response import DeleteRiotAccountLinkResponse


class UnlinkRiotAccount:
    """Quita la cuenta de Riot del perfil. El rango del perfil queda como estaba (el último que vino de Riot)."""

    def __init__(self, uow: IUnitOfWork):
        self.uow: IUnitOfWork = uow

    def execute(self, player_id: int, game_profile_id: int) -> DeleteRiotAccountLinkResponse:
        with self.uow as uow:
            CatalogValidationService.get_and_validate_exists_game_profile(game_profile_id, player_id, uow)

            if not uow.riot_account_link_repo.delete_by_game_profile_id(game_profile_id):
                raise RiotAccountNotLinkedException(game_profile_id)

        return DeleteRiotAccountLinkResponse(message="La cuenta de Riot se desvinculó del perfil.")
