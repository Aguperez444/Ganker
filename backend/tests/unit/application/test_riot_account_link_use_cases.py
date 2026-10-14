from datetime import datetime, timedelta
from unittest.mock import MagicMock

import pytest

from app.application.ports.i_riot_game_provider import IRiotGameProvider
from app.application.ports.i_riot_game_provider_resolver import IRiotGameProviderResolver
from app.application.use_cases.link_riot_account import LinkRiotAccount
from app.application.use_cases.query_riot_account_link import QueryRiotAccountLink
from app.application.use_cases.refresh_riot_stats import RefreshRiotStats
from app.application.use_cases.unlink_riot_account import UnlinkRiotAccount
from app.domain.exceptions.game_profile.does_not_belong_to_profile_exception import DoesNotBelongToProfileException
from app.domain.exceptions.game_profile.game_profile_not_found_exception import GameProfileNotFoundException
from app.domain.exceptions.riot.invalid_riot_id_exception import InvalidRiotIdException
from app.domain.exceptions.riot.riot_account_already_linked_exception import RiotAccountAlreadyLinkedException
from app.domain.exceptions.riot.riot_account_not_found_exception import RiotAccountNotFoundException
from app.domain.exceptions.riot.riot_account_not_linked_exception import RiotAccountNotLinkedException
from app.domain.exceptions.riot.riot_api_unavailable_exception import RiotApiUnavailableException
from app.domain.exceptions.riot.riot_link_not_supported_exception import RiotLinkNotSupportedException
from app.domain.exceptions.riot.riot_stats_not_available_exception import RiotStatsNotAvailableException
from app.domain.exceptions.riot.riot_stats_refresh_too_soon_exception import RiotStatsRefreshTooSoonException
from app.domain.models.game_profile import GameProfile
from app.domain.models.lol_stats import LolMatch, LolRankedEntry, LolStats
from app.domain.models.rank import Rank
from app.domain.models.riot_account import RiotAccount
from app.domain.models.riot_account_link import RiotAccountLink
from app.domain.models.role import Role
from app.domain.models.role_profile import RoleProfile
from app.domain.models.videogame import Videogame

COOLDOWN = timedelta(minutes=5)
LOL = Videogame(videogame_id=2, name="League of Legends", icon_url="/lol.png", rank_per_role=False)
VALORANT = Videogame(videogame_id=1, name="Valorant", icon_url="/val.png", rank_per_role=False)
OVERWATCH = Videogame(videogame_id=3, name="Overwatch", icon_url="/ow.png", rank_per_role=True)
BRONCE = Rank(rank_id=1, name="Bronce", value=1, videogame=LOL, icon_url="")
ORO = Rank(rank_id=2, name="Oro", value=2, videogame=LOL, icon_url="")
ACCOUNT = RiotAccount(puuid="puuid-ana", game_name="Ana", tag_line="LAS")
STATS = LolStats(
    summoner_level=120,
    profile_icon_url="https://ddragon/profileicon/1.png",
    ranked=[LolRankedEntry("RANKED_SOLO_5x5", "Solo/Dúo", "Oro", "II", 40, 30, 20)],
    matches=[LolMatch("LA2_1", "Ahri", None, 5, 2, 8, True, "Mid", 180, 1800, "Solo/Dúo", datetime(2026, 10, 1))],
)


def _profile(videogame=LOL, player_id=1, game_profile_id=10) -> GameProfile:
    role = Role(role_id=1, name="Mid", videogame=videogame, icon_url="")
    return GameProfile(game_profile_id=game_profile_id, player_id=player_id, videogame=videogame,
                       characters_priority=[], role_profiles=[RoleProfile(role_profile_id=1, role=role, rank=BRONCE)])


def _saved(link: RiotAccountLink) -> RiotAccountLink:
    return RiotAccountLink(link_id=1, game_profile_id=link.game_profile_id, account=link.account,
                           server=link.server, stats=link.stats, last_synced_at=link.last_synced_at)


def _provider(requires_server: bool, provides_stats: bool, server: str, stats) -> MagicMock:
    provider = MagicMock(spec=IRiotGameProvider)
    provider.requires_server = requires_server
    provider.provides_stats = provides_stats
    provider.find_account.return_value = (ACCOUNT, server)
    provider.fetch_stats.return_value = stats
    return provider


@pytest.fixture
def deps():
    uow = MagicMock()
    uow.__enter__.return_value = uow
    uow.__exit__.return_value = None
    uow.game_profile_repo.get_game_profile_by_id.return_value = _profile()
    uow.rank_repo.get_ranks_by_game_id.return_value = [BRONCE, ORO]
    uow.riot_account_link_repo.get_by_puuid.return_value = []
    uow.riot_account_link_repo.get_by_game_profile_id.return_value = None
    uow.riot_account_link_repo.save.side_effect = _saved

    lol = _provider(requires_server=True, provides_stats=True, server="la2", stats=STATS)
    valorant = _provider(requires_server=False, provides_stats=False, server="latam", stats=None)
    providers = {"League of Legends": lol, "Valorant": valorant}

    resolver = MagicMock(spec=IRiotGameProviderResolver)
    resolver.get_provider_for.side_effect = lambda videogame: providers.get(videogame.name)
    return uow, resolver, lol, valorant


class TestLinkRiotAccount:

    def test_link_lol_saves_stats_and_replaces_profile_rank(self, deps):
        uow, resolver, lol, _ = deps

        result = LinkRiotAccount(resolver, uow, COOLDOWN).execute(1, 10, "Ana#LAS", "la2")

        lol.find_account.assert_called_once_with("Ana", "LAS", "la2")
        assert (result.linked, result.requires_server, result.provides_stats) == (True, True, True)
        assert result.riot_id == "Ana#LAS"
        assert result.server == "la2"
        assert result.stats.summoner_level == 120
        assert result.stats.recent.main_role == "Mid"
        assert result.rank_sync.status == "updated"
        assert result.rank_sync.rank_name == "Oro"

        updated_profile = uow.game_profile_repo.update_game_profile.call_args.args[0]
        assert updated_profile.role_profiles[0].rank is ORO
        assert uow.riot_account_link_repo.save.call_args.args[0].account == ACCOUNT

    def test_link_valorant_saves_account_and_region_without_stats(self, deps):
        uow, resolver, _, valorant = deps
        uow.game_profile_repo.get_game_profile_by_id.return_value = _profile(videogame=VALORANT)

        result = LinkRiotAccount(resolver, uow, COOLDOWN).execute(1, 10, "Ana#LAS", None)

        valorant.find_account.assert_called_once_with("Ana", "LAS", None)
        assert (result.linked, result.requires_server, result.provides_stats) == (True, False, False)
        assert result.server == "latam"
        assert (result.stats, result.rank_sync, result.next_refresh_at) == (None, None, None)
        uow.game_profile_repo.update_game_profile.assert_not_called()
        saved = uow.riot_account_link_repo.save.call_args.args[0]
        assert (saved.server, saved.stats, saved.last_synced_at) == ("latam", None, None)

    def test_link_invalid_riot_id_does_not_call_riot(self, deps):
        uow, resolver, lol, _ = deps
        with pytest.raises(InvalidRiotIdException):
            LinkRiotAccount(resolver, uow, COOLDOWN).execute(1, 10, "SinTag", "la2")
        lol.find_account.assert_not_called()

    def test_link_profile_of_another_player(self, deps):
        uow, resolver, _, _ = deps
        uow.game_profile_repo.get_game_profile_by_id.return_value = _profile(player_id=99)
        with pytest.raises(DoesNotBelongToProfileException):
            LinkRiotAccount(resolver, uow, COOLDOWN).execute(1, 10, "Ana#LAS", "la2")

    def test_link_profile_not_found(self, deps):
        uow, resolver, _, _ = deps
        uow.game_profile_repo.get_game_profile_by_id.return_value = None
        with pytest.raises(GameProfileNotFoundException):
            LinkRiotAccount(resolver, uow, COOLDOWN).execute(1, 10, "Ana#LAS", "la2")

    def test_link_not_supported_for_games_without_riot(self, deps):
        uow, resolver, _, _ = deps
        uow.game_profile_repo.get_game_profile_by_id.return_value = _profile(videogame=OVERWATCH)
        with pytest.raises(RiotLinkNotSupportedException) as exc_info:
            LinkRiotAccount(resolver, uow, COOLDOWN).execute(1, 10, "Ana#LAS", "la2")
        assert exc_info.value.status_code == 400

    def test_link_account_not_found(self, deps):
        uow, resolver, lol, _ = deps
        lol.find_account.side_effect = RiotAccountNotFoundException("Ana#LAS", "LAS")
        with pytest.raises(RiotAccountNotFoundException):
            LinkRiotAccount(resolver, uow, COOLDOWN).execute(1, 10, "Ana#LAS", "la2")
        uow.riot_account_link_repo.save.assert_not_called()

    def test_link_account_already_linked_by_another_player_in_same_game(self, deps):
        uow, resolver, lol, _ = deps
        uow.riot_account_link_repo.get_by_puuid.return_value = [
            RiotAccountLink(link_id=5, game_profile_id=77, account=ACCOUNT, server="la2")]
        uow.game_profile_repo.get_game_profile_by_id.side_effect = (
            lambda gp_id: _profile(game_profile_id=gp_id, player_id=1 if gp_id == 10 else 99))

        with pytest.raises(RiotAccountAlreadyLinkedException) as exc_info:
            LinkRiotAccount(resolver, uow, COOLDOWN).execute(1, 10, "Ana#LAS", "la2")

        assert exc_info.value.status_code == 409
        lol.fetch_stats.assert_not_called()

    def test_same_account_can_be_linked_to_lol_and_valorant(self, deps):
        uow, resolver, _, _ = deps
        # La cuenta ya está en el perfil de LoL (77); ahora se vincula al de Valorant (10)
        uow.riot_account_link_repo.get_by_puuid.return_value = [
            RiotAccountLink(link_id=5, game_profile_id=77, account=ACCOUNT, server="la2")]
        uow.game_profile_repo.get_game_profile_by_id.side_effect = (
            lambda gp_id: _profile(videogame=VALORANT if gp_id == 10 else LOL, game_profile_id=gp_id))

        result = LinkRiotAccount(resolver, uow, COOLDOWN).execute(1, 10, "Ana#LAS", None)

        assert result.linked is True

    def test_relink_same_profile_replaces_previous_link(self, deps):
        uow, resolver, _, _ = deps
        uow.riot_account_link_repo.get_by_puuid.return_value = [
            RiotAccountLink(link_id=5, game_profile_id=10, account=ACCOUNT, server="la2")]

        LinkRiotAccount(resolver, uow, COOLDOWN).execute(1, 10, "Ana#LAS", "la2")

        uow.riot_account_link_repo.delete_by_game_profile_id.assert_called_once_with(10)
        uow.riot_account_link_repo.save.assert_called_once()

    def test_link_riot_api_down_propagates(self, deps):
        uow, resolver, lol, _ = deps
        lol.fetch_stats.side_effect = RiotApiUnavailableException()
        with pytest.raises(RiotApiUnavailableException):
            LinkRiotAccount(resolver, uow, COOLDOWN).execute(1, 10, "Ana#LAS", "la2")
        uow.riot_account_link_repo.save.assert_not_called()


class TestRefreshRiotStats:

    def _linked(self, uow, synced_minutes_ago: int):
        uow.riot_account_link_repo.get_by_game_profile_id.return_value = RiotAccountLink(
            link_id=1, game_profile_id=10, account=ACCOUNT, server="la2", stats=None,
            last_synced_at=datetime.now() - timedelta(minutes=synced_minutes_ago))

    def test_refresh_updates_stats(self, deps):
        uow, resolver, lol, _ = deps
        self._linked(uow, synced_minutes_ago=10)

        result = RefreshRiotStats(resolver, uow, COOLDOWN).execute(1, 10)

        lol.fetch_stats.assert_called_once_with(ACCOUNT, "la2")
        assert result.stats.summoner_level == 120
        assert result.rank_sync.status == "updated"
        assert result.next_refresh_at > datetime.now()

    def test_refresh_too_soon(self, deps):
        uow, resolver, lol, _ = deps
        self._linked(uow, synced_minutes_ago=1)

        with pytest.raises(RiotStatsRefreshTooSoonException) as exc_info:
            RefreshRiotStats(resolver, uow, COOLDOWN).execute(1, 10)

        assert exc_info.value.status_code == 429
        assert "4 minutos" in exc_info.value.message
        lol.fetch_stats.assert_not_called()

    def test_refresh_without_link(self, deps):
        uow, resolver, _, _ = deps
        with pytest.raises(RiotAccountNotLinkedException):
            RefreshRiotStats(resolver, uow, COOLDOWN).execute(1, 10)

    def test_refresh_valorant_has_no_stats(self, deps):
        uow, resolver, _, valorant = deps
        uow.game_profile_repo.get_game_profile_by_id.return_value = _profile(videogame=VALORANT)

        with pytest.raises(RiotStatsNotAvailableException) as exc_info:
            RefreshRiotStats(resolver, uow, COOLDOWN).execute(1, 10)

        assert exc_info.value.status_code == 400
        valorant.fetch_stats.assert_not_called()


class TestUnlinkRiotAccount:

    def test_unlink(self, deps):
        uow, _, _, _ = deps
        uow.riot_account_link_repo.delete_by_game_profile_id.return_value = True
        assert "desvinculó" in UnlinkRiotAccount(uow).execute(1, 10).message

    def test_unlink_without_link(self, deps):
        uow, _, _, _ = deps
        uow.riot_account_link_repo.delete_by_game_profile_id.return_value = False
        with pytest.raises(RiotAccountNotLinkedException):
            UnlinkRiotAccount(uow).execute(1, 10)

    def test_unlink_profile_of_another_player(self, deps):
        uow, _, _, _ = deps
        uow.game_profile_repo.get_game_profile_by_id.return_value = _profile(player_id=99)
        with pytest.raises(DoesNotBelongToProfileException):
            UnlinkRiotAccount(uow).execute(1, 10)
        uow.riot_account_link_repo.delete_by_game_profile_id.assert_not_called()


class TestQueryRiotAccountLink:

    def test_not_linked_lol_profile(self, deps):
        uow, resolver, _, _ = deps
        result = QueryRiotAccountLink(resolver, uow, COOLDOWN).execute(10)
        assert (result.supported, result.linked, result.requires_server, result.provides_stats) == (True, False, True, True)

    def test_not_linked_valorant_profile(self, deps):
        uow, resolver, _, _ = deps
        uow.game_profile_repo.get_game_profile_by_id.return_value = _profile(videogame=VALORANT)
        result = QueryRiotAccountLink(resolver, uow, COOLDOWN).execute(10)
        assert (result.supported, result.requires_server, result.provides_stats) == (True, False, False)

    def test_games_without_riot_are_not_supported(self, deps):
        uow, resolver, _, _ = deps
        uow.game_profile_repo.get_game_profile_by_id.return_value = _profile(videogame=OVERWATCH)
        assert QueryRiotAccountLink(resolver, uow, COOLDOWN).execute(10).supported is False

    def test_linked_returns_saved_stats_without_calling_riot(self, deps):
        uow, resolver, lol, _ = deps
        uow.riot_account_link_repo.get_by_game_profile_id.return_value = RiotAccountLink(
            link_id=1, game_profile_id=10, account=ACCOUNT, server="la2", stats=STATS,
            last_synced_at=datetime(2026, 10, 14, 12, 0))

        result = QueryRiotAccountLink(resolver, uow, COOLDOWN).execute(10)

        assert result.linked is True
        assert result.rank_sync is None
        assert result.stats.ranked[0].tier == "Oro"
        assert result.next_refresh_at == datetime(2026, 10, 14, 12, 5)
        lol.fetch_stats.assert_not_called()

    def test_profile_not_found(self, deps):
        uow, resolver, _, _ = deps
        uow.game_profile_repo.get_game_profile_by_id.return_value = None
        with pytest.raises(GameProfileNotFoundException):
            QueryRiotAccountLink(resolver, uow, COOLDOWN).execute(10)
