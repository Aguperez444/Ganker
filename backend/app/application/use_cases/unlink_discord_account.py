from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.discord.discord_account_not_linked_exception import DiscordAccountNotLinkedException
from app.infrastructure.api.dto.response.delete.delete_discord_account_link_response import DeleteDiscordAccountLinkResponse


class UnlinkDiscordAccount:

    def __init__(self, uow: IUnitOfWork):
        self.uow: IUnitOfWork = uow

    def execute(self, user_id: int) -> DeleteDiscordAccountLinkResponse:
        with self.uow as uow:
            if not uow.discord_account_link_repo.delete_by_user_id(user_id):
                raise DiscordAccountNotLinkedException()

        return DeleteDiscordAccountLinkResponse(message="Tu cuenta de Discord se desvinculó de Ganker.")
