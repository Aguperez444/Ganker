from datetime import datetime, timedelta

import pytest

from app.domain.exceptions.riot.invalid_riot_id_exception import InvalidRiotIdException
from app.domain.models.game_profile import GameProfile
from app.domain.models.lol_stats import LolMatch, LolRankedEntry
from app.domain.models.riot_account import RiotAccount
from app.domain.models.rank import Rank
from app.domain.models.riot_account_link import RiotAccountLink
from app.domain.models.role import Role
from app.domain.models.role_profile import RoleProfile
from app.domain.models.videogame import Videogame
from app.domain.services.lol_stats_summary_service import LolStatsSummaryService
from app.domain.services.riot_id_service import RiotIdService
from app.domain.services.riot_rank_sync_service import RankSyncStatus, RiotRankSyncService

LOL = Videogame(videogame_id=2, name="League of Legends", icon_url="/lol.png", rank_per_role=False)
BRONCE = Rank(rank_id=1, name="Bronce", value=1, videogame=LOL, icon_url="/bronce.png")
ORO = Rank(rank_id=2, name="Oro", value=2, videogame=LOL, icon_url="/oro.png")
DIAMANTE = Rank(rank_id=3, name="Diamante", value=3, videogame=LOL, icon_url="/diamante.png")


def _entry(queue_type="RANKED_SOLO_5x5", tier="Oro", division="II") -> LolRankedEntry:
    return LolRankedEntry(queue_type=queue_type, queue="Solo/Dúo", tier=tier, division=division,
                          league_points=40, wins=30, losses=20)


def _match(champion="Ahri", kills=5, deaths=2, assists=8, win=True, role="Mid") -> LolMatch:
    return LolMatch(match_id=f"LA2_{champion}_{kills}", champion_name=champion, champion_icon_url=None,
                    kills=kills, deaths=deaths, assists=assists, win=win, role=role, cs=180,
                    duration_seconds=1800, queue="Solo/Dúo", played_at=datetime(2026, 10, 1, 20, 0))


def _profile(*ranks: Rank) -> GameProfile:
    role_profiles = [
        RoleProfile(role_profile_id=i + 1, role=Role(role_id=i + 1, name=f"Rol {i}", videogame=LOL, icon_url=""),
                    rank=rank)
        for i, rank in enumerate(ranks)
    ]
    return GameProfile(game_profile_id=10, player_id=1, videogame=LOL, characters_priority=[],
                       role_profiles=role_profiles)


class TestRiotIdService:

    @pytest.mark.parametrize("riot_id, expected", [
        ("Faker#KR1", ("Faker", "KR1")),
        ("  Mi Nombre#LAS  ", ("Mi Nombre", "LAS")),
        ("Kai Sa Main#12345", ("Kai Sa Main", "12345")),
    ])
    def test_parse_valid(self, riot_id, expected):
        assert RiotIdService.parse(riot_id) == expected

    @pytest.mark.parametrize("riot_id", ["Faker", "Faker#", "#KR1", "ab#KR1", "Faker#K", "Faker#KR1234", "a#b#c", ""])
    def test_parse_invalid(self, riot_id):
        with pytest.raises(InvalidRiotIdException) as exc_info:
            RiotIdService.parse(riot_id)
        assert exc_info.value.status_code == 400


class TestLolStatsSummaryService:

    def test_summary_without_matches(self):
        summary = LolStatsSummaryService.summarize([])
        assert summary.games == 0
        assert summary.main_role is None
        assert summary.most_played == []

    def test_summary_kda_winrate_and_main_role(self):
        matches = [
            _match("Ahri", 10, 2, 10, True, "Mid"),
            _match("Ahri", 2, 4, 6, False, "Mid"),
            _match("Lux", 3, 0, 12, True, "Support"),
            _match("Ahri", 6, 3, 2, True, "Mid"),
        ]

        summary = LolStatsSummaryService.summarize(matches)

        assert (summary.games, summary.wins, summary.losses) == (4, 3, 1)
        assert summary.winrate == 75.0
        assert summary.avg_kills == 5.2
        assert summary.kda == round((21 + 30) / 9, 2)
        assert summary.main_role == "Mid"
        assert [c.champion_name for c in summary.most_played] == ["Ahri", "Lux"]
        ahri = summary.most_played[0]
        assert (ahri.games, ahri.wins, ahri.winrate) == (3, 2, 66.7)

    def test_kda_without_deaths_is_kills_plus_assists(self):
        summary = LolStatsSummaryService.summarize([_match(kills=4, deaths=0, assists=6)])
        assert summary.kda == 10.0

    def test_modes_without_roles_do_not_count_for_main_role(self):
        summary = LolStatsSummaryService.summarize([_match(role=None), _match(role=None)])
        assert summary.main_role is None


class TestRiotRankSyncService:

    def test_prefers_solo_queue_over_flex(self):
        flex = _entry(queue_type="RANKED_FLEX_SR", tier="Diamante")
        solo = _entry(queue_type="RANKED_SOLO_5x5", tier="Bronce")
        assert RiotRankSyncService.pick_main_entry([flex, solo]) is solo
        assert RiotRankSyncService.pick_main_entry([flex]) is flex
        assert RiotRankSyncService.pick_main_entry([]) is None

    def test_matches_rank_by_name_ignoring_case_and_accents(self):
        ranks = [Rank(rank_id=9, name="  ORO ", value=1, videogame=LOL, icon_url="")]
        assert RiotRankSyncService.find_matching_rank(_entry(tier="Oro"), ranks).rank_id == 9

    def test_prefers_rank_with_division_if_admin_loaded_it(self):
        oro_dos = Rank(rank_id=7, name="Oro II", value=5, videogame=LOL, icon_url="")
        assert RiotRankSyncService.find_matching_rank(_entry(tier="Oro", division="II"), [ORO, oro_dos]) is oro_dos

    def test_sync_replaces_rank_of_every_role(self):
        profile = _profile(BRONCE, ORO)

        status, rank = RiotRankSyncService.sync_profile_rank(profile, [_entry(tier="Diamante")], [BRONCE, ORO, DIAMANTE])

        assert status == RankSyncStatus.UPDATED
        assert rank is DIAMANTE
        assert all(rp.rank is DIAMANTE for rp in profile.role_profiles)

    def test_sync_unchanged_when_rank_already_matches(self):
        status, _ = RiotRankSyncService.sync_profile_rank(_profile(ORO), [_entry(tier="Oro")], [ORO])
        assert status == RankSyncStatus.UNCHANGED

    def test_sync_unranked_keeps_profile_rank(self):
        profile = _profile(BRONCE)
        status, rank = RiotRankSyncService.sync_profile_rank(profile, [], [BRONCE, ORO])
        assert (status, rank) == (RankSyncStatus.UNRANKED, None)
        assert profile.role_profiles[0].rank is BRONCE

    def test_sync_without_matching_rank_keeps_profile_rank(self):
        profile = _profile(BRONCE)
        status, _ = RiotRankSyncService.sync_profile_rank(profile, [_entry(tier="Retador", division=None)], [BRONCE])
        assert status == RankSyncStatus.NO_MATCHING_RANK
        assert profile.role_profiles[0].rank is BRONCE

    def test_sync_profile_without_roles(self):
        status, rank = RiotRankSyncService.sync_profile_rank(_profile(), [_entry(tier="Oro")], [ORO])
        assert (status, rank) == (RankSyncStatus.NO_ROLES, ORO)


class TestRiotAccountLink:

    def test_refresh_cooldown(self):
        synced_at = datetime(2026, 10, 14, 12, 0)
        link = RiotAccountLink(link_id=1, game_profile_id=10, account=RiotAccount("p", "Ana", "LAS"),
                               server="la2", last_synced_at=synced_at)
        cooldown = timedelta(minutes=5)

        assert link.next_refresh_at(cooldown) == datetime(2026, 10, 14, 12, 5)
        assert not link.can_refresh(datetime(2026, 10, 14, 12, 4), cooldown)
        assert link.can_refresh(datetime(2026, 10, 14, 12, 5), cooldown)
        assert link.account.riot_id == "Ana#LAS"

    def test_never_synced_can_refresh(self):
        link = RiotAccountLink(link_id=None, game_profile_id=10, account=RiotAccount("p", "Ana", "LAS"),
                               server="la2")
        assert link.can_refresh(datetime.now(), timedelta(minutes=5))
        assert not link.is_persisted()
