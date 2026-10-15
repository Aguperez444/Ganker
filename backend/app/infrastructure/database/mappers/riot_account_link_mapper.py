from dataclasses import asdict
from datetime import datetime
from typing import Optional

from app.domain.models.lol_stats import LolChampionMastery, LolMatch, LolRankedEntry, LolStats
from app.domain.models.riot_account import RiotAccount
from app.domain.models.riot_account_link import RiotAccountLink
from app.infrastructure.database.models.riot_account_link_orm import RiotAccountLinkORM


class RiotAccountLinkMapper:
    @staticmethod
    def orm_to_domain(orm: RiotAccountLinkORM) -> RiotAccountLink:
        return RiotAccountLink(
            link_id=orm.riot_account_link_id,
            game_profile_id=orm.game_profile_id,
            account=RiotAccount(puuid=orm.puuid, game_name=orm.game_name, tag_line=orm.tag_line),
            server=orm.server,
            stats=RiotAccountLinkMapper.stats_from_json(orm.stats),
            last_synced_at=orm.last_synced_at,
        )

    @staticmethod
    def domain_to_orm(link: RiotAccountLink) -> RiotAccountLinkORM:
        orm = RiotAccountLinkORM(
            game_profile_id=link.game_profile_id,
            puuid=link.account.puuid,
            game_name=link.account.game_name,
            tag_line=link.account.tag_line,
            server=link.server,
            stats=RiotAccountLinkMapper.stats_to_json(link.stats),
            last_synced_at=link.last_synced_at,
        )
        if link.is_persisted():
            orm.riot_account_link_id = link.link_id
        return orm

    @staticmethod
    def stats_to_json(stats: Optional[LolStats]) -> Optional[dict]:
        if stats is None:
            return None
        data = asdict(stats)
        # JSON no tiene fechas: se guardan en formato ISO
        for match in data["matches"]:
            match["played_at"] = match["played_at"].isoformat()
        return data

    @staticmethod
    def stats_from_json(data: Optional[dict]) -> Optional[LolStats]:
        if not data:
            return None
        return LolStats(
            summoner_level=data["summoner_level"],
            profile_icon_url=data.get("profile_icon_url"),
            ranked=[LolRankedEntry(**entry) for entry in data.get("ranked", [])],
            top_masteries=[LolChampionMastery(**mastery) for mastery in data.get("top_masteries", [])],
            matches=[LolMatch(**{**match, "played_at": datetime.fromisoformat(match["played_at"])})
                     for match in data.get("matches", [])],
        )
