from unittest.mock import MagicMock

from app.domain.models.discord_account_link import DiscordAccount, DiscordAccountLink, DiscordVisibility
from app.domain.services.discord_visibility_service import DiscordVisibilityService

OWNER_ID, TEAMMATE_ID, STRANGER_ID = 1, 2, 3
ACCOUNT = DiscordAccount(discord_user_id="80351110224678912", username="ana_gamer", global_name="Ana", avatar_url=None)


def _link(visibility: DiscordVisibility) -> DiscordAccountLink:
    return DiscordAccountLink(link_id=1, user_id=OWNER_ID, account=ACCOUNT, visibility=visibility)


def _team_with(*member_ids):
    team = MagicMock()
    team.has_member.side_effect = lambda user_id: user_id in member_ids
    return team


class TestDiscordVisibilityService:

    def test_owner_always_sees_it(self):
        assert DiscordVisibilityService.can_view(_link(DiscordVisibility.TEAMMATES), OWNER_ID, None)

    def test_everyone(self):
        assert DiscordVisibilityService.can_view(_link(DiscordVisibility.EVERYONE), STRANGER_ID, None)

    def test_teammates_only(self):
        link = _link(DiscordVisibility.TEAMMATES)
        team = _team_with(OWNER_ID, TEAMMATE_ID)
        assert DiscordVisibilityService.can_view(link, TEAMMATE_ID, team)
        assert not DiscordVisibilityService.can_view(link, STRANGER_ID, team)

    def test_teammates_only_without_team(self):
        assert not DiscordVisibilityService.can_view(_link(DiscordVisibility.TEAMMATES), STRANGER_ID, None)


class TestDiscordAccount:

    def test_display_name_falls_back_to_username(self):
        assert ACCOUNT.display_name == "Ana"
        assert DiscordAccount("1", "ana_gamer", None, None).display_name == "ana_gamer"

    def test_link_defaults_to_teammates(self):
        link = DiscordAccountLink(link_id=None, user_id=OWNER_ID, account=ACCOUNT)
        assert link.visibility == DiscordVisibility.TEAMMATES
        assert not link.is_persisted()
