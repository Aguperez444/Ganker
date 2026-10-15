from typing import TYPE_CHECKING

from app.infrastructure.api.dto.response.get.get_discord_account_response import GetDiscordAccountResponse

if TYPE_CHECKING:
    from app.domain.models.discord_account_link import DiscordAccountLink


class CreateDiscordDTOService:

    @staticmethod
    def not_visible() -> GetDiscordAccountResponse:
        # No se distingue "no tiene Discord" de "no lo comparte con vos": no se filtra ese dato
        return GetDiscordAccountResponse(linked=False)

    @staticmethod
    def create_response(link: 'DiscordAccountLink', for_owner: bool) -> GetDiscordAccountResponse:
        account = link.account
        return GetDiscordAccountResponse(
            linked=True,
            discord_user_id=account.discord_user_id,
            username=account.username,
            display_name=account.display_name,
            avatar_url=account.avatar_url,
            profile_url=f"https://discord.com/users/{account.discord_user_id}",
            visibility=link.visibility.value if for_owner else None,
            linked_at=link.linked_at if for_owner else None,
        )
