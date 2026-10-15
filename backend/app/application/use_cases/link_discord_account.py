from datetime import datetime

from app.application.ports.i_discord_oauth_provider import IDiscordOAuthProvider
from app.application.ports.i_oauth_state_service import IOAuthStateService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.discord.discord_account_already_linked_exception import DiscordAccountAlreadyLinkedException
from app.domain.models.discord_account_link import DiscordAccountLink, DiscordVisibility
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.services.create_discord_dto_service import CreateDiscordDTOService
from app.infrastructure.api.dto.response.get.get_discord_account_response import GetDiscordAccountResponse


class LinkDiscordAccount:
    """
    Segundo paso de "Conectar con Discord": con el código que devolvió Discord obtiene la cuenta verificada
    del jugador y la vincula a su perfil general. Si ya tenía otra cuenta de Discord, la reemplaza.
    """

    def __init__(self, oauth_provider: IDiscordOAuthProvider, state_service: IOAuthStateService, uow: IUnitOfWork):
        self.oauth_provider: IDiscordOAuthProvider = oauth_provider
        self.state_service: IOAuthStateService = state_service
        self.uow: IUnitOfWork = uow

    def execute(self, user_id: int, code: str, state: str, visibility: DiscordVisibility) -> GetDiscordAccountResponse:
        # Antes que nada: que la autorización la haya pedido este mismo jugador
        self.state_service.validate_state(state, user_id)
        account = self.oauth_provider.exchange_code(code)

        with self.uow as uow:
            CatalogValidationService.get_and_validate_exist_user(user_id, uow)

            linked_elsewhere = uow.discord_account_link_repo.get_by_discord_user_id(account.discord_user_id)
            if linked_elsewhere and linked_elsewhere.user_id != user_id:
                raise DiscordAccountAlreadyLinkedException(account.username)

            uow.discord_account_link_repo.delete_by_user_id(user_id)
            link = uow.discord_account_link_repo.save(
                DiscordAccountLink(link_id=None, user_id=user_id, account=account, visibility=visibility,
                                   linked_at=datetime.now())
            )

        return CreateDiscordDTOService.create_response(link, for_owner=True)
