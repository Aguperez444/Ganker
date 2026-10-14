from datetime import timedelta
from typing import TYPE_CHECKING, Optional

from app.domain.services.lol_stats_summary_service import LolStatsSummaryService
from app.domain.services.riot_rank_sync_service import RankSyncStatus
from app.infrastructure.api.dto.response.get.get_riot_account_link_response import (
    GetRiotAccountLinkResponse, RankSyncResponse, RiotChampionMasteryResponse, RiotChampionRecentStatsResponse,
    RiotMatchResponse, RiotRankedEntryResponse, RiotRecentSummaryResponse, RiotStatsResponse,
)

if TYPE_CHECKING:
    from app.application.ports.i_riot_game_provider import IRiotGameProvider
    from app.domain.models.lol_stats import LolStats
    from app.domain.models.rank import Rank
    from app.domain.models.riot_account_link import RiotAccountLink


RANK_SYNC_MESSAGES = {
    RankSyncStatus.UPDATED: "El rango de tu perfil se actualizó a {rank}, según tu cuenta de Riot.",
    RankSyncStatus.UNCHANGED: "Tu rango ya coincidía con el de tu cuenta de Riot ({rank}).",
    RankSyncStatus.UNRANKED: "Tu cuenta todavía no tiene rango en clasificatorias, así que el rango del perfil no cambió.",
    RankSyncStatus.NO_MATCHING_RANK: "Ganker no tiene cargado un rango equivalente al de tu cuenta, así que el rango del perfil no cambió.",
    RankSyncStatus.NO_ROLES: "Tu perfil no tiene roles cargados: agregá al menos uno para que se le aplique el rango {rank}.",
}


class CreateRiotLinkDTOService:

    @staticmethod
    def not_linked(provider: Optional['IRiotGameProvider']) -> GetRiotAccountLinkResponse:
        return GetRiotAccountLinkResponse(
            supported=provider is not None,
            linked=False,
            requires_server=bool(provider and provider.requires_server),
            provides_stats=bool(provider and provider.provides_stats),
        )

    @staticmethod
    def create_link_response(link: 'RiotAccountLink', provider: 'IRiotGameProvider', cooldown: timedelta,
                             rank_sync: Optional[tuple[RankSyncStatus, Optional['Rank']]] = None) -> GetRiotAccountLinkResponse:
        return GetRiotAccountLinkResponse(
            supported=True,
            linked=True,
            requires_server=provider.requires_server,
            provides_stats=provider.provides_stats,
            riot_id=link.account.riot_id,
            server=link.server,
            last_synced_at=link.last_synced_at,
            next_refresh_at=link.next_refresh_at(cooldown) if provider.provides_stats else None,
            rank_sync=CreateRiotLinkDTOService._rank_sync(*rank_sync) if rank_sync else None,
            stats=CreateRiotLinkDTOService._stats(link.stats) if link.stats else None,
        )

    @staticmethod
    def _rank_sync(status: RankSyncStatus, rank: Optional['Rank']) -> RankSyncResponse:
        rank_name = rank.name if rank else None
        return RankSyncResponse(
            status=status.value,
            rank_name=rank_name,
            message=RANK_SYNC_MESSAGES[status].format(rank=rank_name),
        )

    @staticmethod
    def _stats(stats: 'LolStats') -> RiotStatsResponse:
        summary = LolStatsSummaryService.summarize(stats.matches)
        return RiotStatsResponse(
            summoner_level=stats.summoner_level,
            profile_icon_url=stats.profile_icon_url,
            ranked=[RiotRankedEntryResponse(
                queue=entry.queue, tier=entry.tier, division=entry.division, league_points=entry.league_points,
                wins=entry.wins, losses=entry.losses, winrate=entry.winrate,
            ) for entry in stats.ranked],
            top_masteries=[RiotChampionMasteryResponse(
                champion_name=mastery.champion_name, icon_url=mastery.icon_url, level=mastery.level,
                points=mastery.points,
            ) for mastery in stats.top_masteries],
            recent=RiotRecentSummaryResponse(
                games=summary.games, wins=summary.wins, losses=summary.losses, winrate=summary.winrate,
                avg_kills=summary.avg_kills, avg_deaths=summary.avg_deaths, avg_assists=summary.avg_assists,
                kda=summary.kda, main_role=summary.main_role,
                most_played=[RiotChampionRecentStatsResponse(
                    champion_name=champion.champion_name, icon_url=champion.icon_url, games=champion.games,
                    wins=champion.wins, winrate=champion.winrate, kda=champion.kda,
                ) for champion in summary.most_played],
            ),
            matches=[RiotMatchResponse(
                match_id=match.match_id, champion_name=match.champion_name,
                champion_icon_url=match.champion_icon_url, kills=match.kills, deaths=match.deaths,
                assists=match.assists, win=match.win, role=match.role, cs=match.cs,
                duration_seconds=match.duration_seconds, queue=match.queue, played_at=match.played_at,
            ) for match in stats.matches],
        )
