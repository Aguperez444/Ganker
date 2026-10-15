from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.discord.discord_account_not_linked_exception import DiscordAccountNotLinkedException
from app.domain.models.discord_account_link import DiscordVisibility
from app.domain.services.create_discord_dto_service import CreateDiscordDTOService
from app.infrastructure.api.dto.response.get.get_discord_account_response import GetDiscordAccountResponse


class UpdateDiscordVisibility:

    def __init__(self, uow: IUnitOfWork):
        self.uow: IUnitOfWork = uow

    def execute(self, user_id: int, visibility: DiscordVisibility) -> GetDiscordAccountResponse:
        with self.uow as uow:
            link = uow.discord_account_link_repo.get_by_user_id(user_id)
            if link is None:
                raise DiscordAccountNotLinkedException()

            link.visibility = visibility
            link = uow.discord_account_link_repo.save(link)

        return CreateDiscordDTOService.create_response(link, for_owner=True)
