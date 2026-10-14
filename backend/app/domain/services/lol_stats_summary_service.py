from collections import Counter
from dataclasses import dataclass, field
from typing import Optional

from app.domain.models.lol_stats import LolMatch

MOST_PLAYED_LIMIT = 3


@dataclass(frozen=True)
class LolChampionRecentStats:
    champion_name: str
    icon_url: Optional[str]
    games: int
    wins: int
    kda: float

    @property
    def winrate(self) -> float:
        return round(self.wins * 100 / self.games, 1) if self.games else 0.0


@dataclass(frozen=True)
class LolRecentSummary:
    games: int
    wins: int
    losses: int
    winrate: float
    avg_kills: float
    avg_deaths: float
    avg_assists: float
    kda: float
    main_role: Optional[str]
    most_played: list[LolChampionRecentStats] = field(default_factory=list)


def _kda(kills: int, deaths: int, assists: int) -> float:
    # Sin muertes, el KDA es kills + asistencias (convención de los sitios de estadísticas)
    return round((kills + assists) / max(deaths, 1), 2)


class LolStatsSummaryService:

    @staticmethod
    def summarize(matches: list[LolMatch]) -> LolRecentSummary:
        """Resume las últimas partidas: winrate, KDA promedio, rol más jugado y campeones más jugados."""
        games = len(matches)
        if games == 0:
            return LolRecentSummary(games=0, wins=0, losses=0, winrate=0.0, avg_kills=0.0, avg_deaths=0.0,
                                    avg_assists=0.0, kda=0.0, main_role=None, most_played=[])

        wins = sum(1 for m in matches if m.win)
        kills = sum(m.kills for m in matches)
        deaths = sum(m.deaths for m in matches)
        assists = sum(m.assists for m in matches)

        roles = Counter(m.role for m in matches if m.role)
        main_role = roles.most_common(1)[0][0] if roles else None

        return LolRecentSummary(
            games=games,
            wins=wins,
            losses=games - wins,
            winrate=round(wins * 100 / games, 1),
            avg_kills=round(kills / games, 1),
            avg_deaths=round(deaths / games, 1),
            avg_assists=round(assists / games, 1),
            kda=_kda(kills, deaths, assists),
            main_role=main_role,
            most_played=LolStatsSummaryService._most_played(matches),
        )

    @staticmethod
    def _most_played(matches: list[LolMatch]) -> list[LolChampionRecentStats]:
        by_champion: dict[str, list[LolMatch]] = {}
        for match in matches:
            by_champion.setdefault(match.champion_name, []).append(match)

        # Más partidas primero; a igualdad, el de mejor winrate
        ordered = sorted(by_champion.values(), key=lambda ms: (-len(ms), -sum(m.win for m in ms)))
        return [
            LolChampionRecentStats(
                champion_name=ms[0].champion_name,
                icon_url=ms[0].champion_icon_url,
                games=len(ms),
                wins=sum(1 for m in ms if m.win),
                kda=_kda(sum(m.kills for m in ms), sum(m.deaths for m in ms), sum(m.assists for m in ms)),
            )
            for ms in ordered[:MOST_PLAYED_LIMIT]
        ]
