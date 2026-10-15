from unittest.mock import MagicMock

import pytest

from app.application.ports.i_discord_oauth_provider import IDiscordOAuthProvider
from app.application.ports.i_oauth_state_service import IOAuthStateService
from app.application.use_cases.get_discord_authorization_url import GetDiscordAuthorizationUrl
from app.application.use_cases.link_discord_account import LinkDiscordAccount
from app.application.use_cases.query_discord_account import QueryDiscordAccount
from app.application.use_cases.unlink_discord_account import UnlinkDiscordAccount
from app.application.use_cases.update_discord_visibility import UpdateDiscordVisibility
from app.domain.exceptions.discord.discord_account_already_linked_exception import DiscordAccountAlreadyLinkedException
from app.domain.exceptions.discord.discord_account_not_linked_exception import DiscordAccountNotLinkedException
from app.domain.exceptions.discord.invalid_oauth_state_exception import InvalidOAuthStateException
from app.domain.exceptions.user.user_not_found_exception import UserNotFoundException
from app.domain.models.discord_account_link import DiscordAccount, DiscordAccountLink, DiscordVisibility

ACCOUNT = DiscordAccount(discord_user_id="555", username="ana_gamer", global_name="Ana", avatar_url="https://cdn/a.png")


def _link(user_id=1, visibility=DiscordVisibility.TEAMMATES, link_id=1):
    return DiscordAccountLink(link_id=link_id, user_id=user_id, account=ACCOUNT, visibility=visibility)


def _saved(link):
    return DiscordAccountLink(link_id=1, user_id=link.user_id, account=link.account, visibility=link.visibility,
                              linked_at=link.linked_at)


@pytest.fixture
def deps():
    uow = MagicMock()
    uow.__enter__.return_value = uow
    uow.__exit__.return_value = None
    uow.user_repo.get_user_by_id.return_value = MagicMock()
    uow.discord_account_link_repo.get_by_discord_user_id.return_value = None
    uow.discord_account_link_repo.get_by_user_id.return_value = None
    uow.discord_account_link_repo.save.side_effect = _saved
    uow.team_repo.get_active_team_by_user_id.return_value = None

    provider = MagicMock(spec=IDiscordOAuthProvider)
    provider.authorization_url.side_effect = lambda state: f"https://discord.com/oauth2/authorize?state={state}"
    provider.exchange_code.return_value = ACCOUNT

    state_service = MagicMock(spec=IOAuthStateService)
    state_service.create_state.return_value = "state-firmado"
    return uow, provider, state_service


class TestGetDiscordAuthorizationUrl:

    def test_url_carries_state_for_the_user(self, deps):
        _, provider, state_service = deps

        result = GetDiscordAuthorizationUrl(provider, state_service).execute(7)

        state_service.create_state.assert_called_once_with(7)
        assert result.authorization_url.endswith("state=state-firmado")


class TestLinkDiscordAccount:

    def test_link_saves_verified_account(self, deps):
        uow, provider, state_service = deps

        result = LinkDiscordAccount(provider, state_service, uow).execute(1, "codigo", "state", DiscordVisibility.EVERYONE)

        state_service.validate_state.assert_called_once_with("state", 1)
        provider.exchange_code.assert_called_once_with("codigo")
        assert (result.linked, result.username, result.display_name) == (True, "ana_gamer", "Ana")
        assert result.profile_url == "https://discord.com/users/555"
        assert result.visibility == "everyone"
        uow.discord_account_link_repo.delete_by_user_id.assert_called_once_with(1)

    def test_invalid_state_stops_before_calling_discord(self, deps):
        uow, provider, state_service = deps
        state_service.validate_state.side_effect = InvalidOAuthStateException()

        with pytest.raises(InvalidOAuthStateException):
            LinkDiscordAccount(provider, state_service, uow).execute(1, "codigo", "robado", DiscordVisibility.EVERYONE)

        provider.exchange_code.assert_not_called()
        uow.discord_account_link_repo.save.assert_not_called()

    def test_discord_account_of_another_player(self, deps):
        uow, provider, state_service = deps
        uow.discord_account_link_repo.get_by_discord_user_id.return_value = _link(user_id=99)

        with pytest.raises(DiscordAccountAlreadyLinkedException) as exc_info:
            LinkDiscordAccount(provider, state_service, uow).execute(1, "codigo", "state", DiscordVisibility.TEAMMATES)

        assert exc_info.value.status_code == 409
        uow.discord_account_link_repo.save.assert_not_called()

    def test_relinking_the_same_account_is_allowed(self, deps):
        uow, provider, state_service = deps
        uow.discord_account_link_repo.get_by_discord_user_id.return_value = _link(user_id=1)

        result = LinkDiscordAccount(provider, state_service, uow).execute(1, "codigo", "state", DiscordVisibility.TEAMMATES)

        assert result.linked is True


class TestUpdateAndUnlinkDiscord:

    def test_update_visibility(self, deps):
        uow, _, _ = deps
        uow.discord_account_link_repo.get_by_user_id.return_value = _link(visibility=DiscordVisibility.TEAMMATES)

        result = UpdateDiscordVisibility(uow).execute(1, DiscordVisibility.EVERYONE)

        assert result.visibility == "everyone"
        assert uow.discord_account_link_repo.save.call_args.args[0].visibility == DiscordVisibility.EVERYONE

    def test_update_visibility_without_link(self, deps):
        uow, _, _ = deps
        with pytest.raises(DiscordAccountNotLinkedException):
            UpdateDiscordVisibility(uow).execute(1, DiscordVisibility.EVERYONE)

    def test_unlink(self, deps):
        uow, _, _ = deps
        uow.discord_account_link_repo.delete_by_user_id.return_value = True
        assert "desvinculó" in UnlinkDiscordAccount(uow).execute(1).message

    def test_unlink_without_link(self, deps):
        uow, _, _ = deps
        uow.discord_account_link_repo.delete_by_user_id.return_value = False
        with pytest.raises(DiscordAccountNotLinkedException):
            UnlinkDiscordAccount(uow).execute(1)


class TestQueryDiscordAccount:

    def test_owner_sees_it_with_visibility(self, deps):
        uow, _, _ = deps
        uow.discord_account_link_repo.get_by_user_id.return_value = _link()

        result = QueryDiscordAccount(uow).execute(owner_id=1, viewer_id=1)

        assert (result.linked, result.visibility) == (True, "teammates")

    def test_everyone_visibility(self, deps):
        uow, _, _ = deps
        uow.discord_account_link_repo.get_by_user_id.return_value = _link(visibility=DiscordVisibility.EVERYONE)

        result = QueryDiscordAccount(uow).execute(owner_id=1, viewer_id=3)

        assert (result.linked, result.username) == (True, "ana_gamer")
        assert result.visibility is None  # Solo el dueño ve su configuración

    def test_teammates_visibility(self, deps):
        uow, _, _ = deps
        uow.discord_account_link_repo.get_by_user_id.return_value = _link()
        team = MagicMock()
        team.has_member.side_effect = lambda user_id: user_id in (1, 2)
        uow.team_repo.get_active_team_by_user_id.return_value = team

        assert QueryDiscordAccount(uow).execute(owner_id=1, viewer_id=2).linked is True
        hidden = QueryDiscordAccount(uow).execute(owner_id=1, viewer_id=3)
        assert (hidden.linked, hidden.username) == (False, None)

    def test_without_link(self, deps):
        uow, _, _ = deps
        assert QueryDiscordAccount(uow).execute(owner_id=1, viewer_id=3).linked is False

    def test_owner_not_found(self, deps):
        uow, _, _ = deps
        uow.user_repo.get_user_by_id.return_value = None
        with pytest.raises(UserNotFoundException):
            QueryDiscordAccount(uow).execute(owner_id=999, viewer_id=1)
