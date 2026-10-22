from typing import TYPE_CHECKING, Optional

from app.application.ports.i_discord_account_link_repository import IDiscordAccountLinkRepository
from app.infrastructure.database.mappers.discord_account_link_mapper import DiscordAccountLinkMapper
from app.infrastructure.database.models.discord_account_link_orm import DiscordAccountLinkORM
from app.infrastructure.database.models.user_orm import UserORM

if TYPE_CHECKING:
    from app.domain.models.discord_account_link import DiscordAccountLink


class DiscordAccountLinkRepositoryImpl(IDiscordAccountLinkRepository):
    def __init__(self, session):
        self.session = session

    def get_by_user_id(self, user_id: int) -> Optional['DiscordAccountLink']:
        found = (
            self.session.query(DiscordAccountLinkORM)
            .join(UserORM, UserORM.user_id == DiscordAccountLinkORM.user_id)
            .filter(
                DiscordAccountLinkORM.user_id == user_id,
                UserORM.deleted == False,
                UserORM.banned == False
            )
            .first()
        )
        return DiscordAccountLinkMapper.orm_to_domain(found) if found else None

    def get_by_discord_user_id(self, discord_user_id: str) -> Optional['DiscordAccountLink']:
        found = (
            self.session.query(DiscordAccountLinkORM)
            .join(UserORM, UserORM.user_id == DiscordAccountLinkORM.user_id)
            .filter(
                DiscordAccountLinkORM.discord_user_id == discord_user_id,
                UserORM.deleted == False,
                UserORM.banned == False
            )
            .first()
        )
        return DiscordAccountLinkMapper.orm_to_domain(found) if found else None

    def save(self, link: 'DiscordAccountLink') -> 'DiscordAccountLink':
        if link.is_persisted():
            orm_link = self.session.query(DiscordAccountLinkORM).filter(
                DiscordAccountLinkORM.discord_account_link_id == link.link_id
            ).first()
            orm_link.visibility = link.visibility.value
        else:
            stale_links = (
                self.session.query(DiscordAccountLinkORM)
                .join(UserORM, UserORM.user_id == DiscordAccountLinkORM.user_id)
                .filter(
                    DiscordAccountLinkORM.discord_user_id == link.account.discord_user_id,
                    UserORM.deleted == True,
                )
                .all()
            )
            for stale in stale_links:
                self.session.delete(stale)
            if stale_links:
                self.session.flush()

            orm_link = DiscordAccountLinkMapper.domain_to_orm(link)
            self.session.add(orm_link)

        self.session.flush()
        self.session.refresh(orm_link)
        return DiscordAccountLinkMapper.orm_to_domain(orm_link)

    def delete_by_user_id(self, user_id: int) -> bool:
        orm_link = self.session.query(DiscordAccountLinkORM).filter(DiscordAccountLinkORM.user_id == user_id).first()
        if orm_link:
            self.session.delete(orm_link)
            self.session.flush()
            return True
        return False
