from typing import TYPE_CHECKING, Optional

from app.application.ports.i_riot_account_link_repository import IRiotAccountLinkRepository
from app.infrastructure.database.mappers.riot_account_link_mapper import RiotAccountLinkMapper
from app.infrastructure.database.models.riot_account_link_orm import RiotAccountLinkORM

if TYPE_CHECKING:
    from app.domain.models.riot_account_link import RiotAccountLink


class RiotAccountLinkRepositoryImpl(IRiotAccountLinkRepository):
    def __init__(self, session):
        self.session = session

    def get_by_game_profile_id(self, game_profile_id: int) -> Optional['RiotAccountLink']:
        found = self.session.query(RiotAccountLinkORM).filter(
            RiotAccountLinkORM.game_profile_id == game_profile_id
        ).first()
        return RiotAccountLinkMapper.orm_to_domain(found) if found else None

    def get_by_puuid(self, puuid: str) -> list['RiotAccountLink']:
        found = self.session.query(RiotAccountLinkORM).filter(RiotAccountLinkORM.puuid == puuid).all()
        return [RiotAccountLinkMapper.orm_to_domain(link) for link in found]

    def save(self, link: 'RiotAccountLink') -> 'RiotAccountLink':
        if link.is_persisted():
            orm_link = self.session.query(RiotAccountLinkORM).filter(
                RiotAccountLinkORM.riot_account_link_id == link.link_id
            ).first()
            orm_link.stats = RiotAccountLinkMapper.stats_to_json(link.stats)
            orm_link.last_synced_at = link.last_synced_at
        else:
            orm_link = RiotAccountLinkMapper.domain_to_orm(link)
            self.session.add(orm_link)

        self.session.flush()
        self.session.refresh(orm_link)
        return RiotAccountLinkMapper.orm_to_domain(orm_link)

    def delete_by_game_profile_id(self, game_profile_id: int) -> bool:
        orm_link = self.session.query(RiotAccountLinkORM).filter(
            RiotAccountLinkORM.game_profile_id == game_profile_id
        ).first()
        if orm_link:
            self.session.delete(orm_link)
            self.session.flush()
            return True
        return False
