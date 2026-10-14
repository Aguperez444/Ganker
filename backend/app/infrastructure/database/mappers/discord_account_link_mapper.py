from app.domain.models.discord_account_link import DiscordAccount, DiscordAccountLink, DiscordVisibility
from app.infrastructure.database.models.discord_account_link_orm import DiscordAccountLinkORM


class DiscordAccountLinkMapper:
    @staticmethod
    def orm_to_domain(orm: DiscordAccountLinkORM) -> DiscordAccountLink:
        return DiscordAccountLink(
            link_id=orm.discord_account_link_id,
            user_id=orm.user_id,
            account=DiscordAccount(
                discord_user_id=orm.discord_user_id,
                username=orm.username,
                global_name=orm.global_name,
                avatar_url=orm.avatar_url,
            ),
            visibility=DiscordVisibility(orm.visibility),
            linked_at=orm.linked_at,
        )

    @staticmethod
    def domain_to_orm(link: DiscordAccountLink) -> DiscordAccountLinkORM:
        orm = DiscordAccountLinkORM(
            user_id=link.user_id,
            discord_user_id=link.account.discord_user_id,
            username=link.account.username,
            global_name=link.account.global_name,
            avatar_url=link.account.avatar_url,
            visibility=link.visibility.value,
            linked_at=link.linked_at,
        )
        if link.is_persisted():
            orm.discord_account_link_id = link.link_id
        return orm
