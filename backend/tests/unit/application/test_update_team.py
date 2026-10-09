import pytest
from unittest.mock import MagicMock
from app.application.use_cases.update_team import UpdateTeam
from app.infrastructure.api.dto.request.update_team_request import UpdateTeamRequest
from app.domain.models.user import User
from app.domain.models.videogame import Videogame
from app.domain.models.region import Region
from app.domain.models.rank import Rank
from app.domain.models.role import Role
from app.domain.models.user_role import UserRole
from app.domain.models.game_profile import GameProfile
from app.domain.models.role_profile import RoleProfile
from app.domain.models.team import Team
from app.domain.models.team_member_role import TeamMemberRole
from app.domain.models.team_role_enum import TeamRoleEnum
from app.domain.models.conversation import Conversation
from app.domain.models.conversation_type_enum import ConversationTypeEnum
from app.domain.exceptions.team.team_not_found_exception import TeamNotFoundException
from app.domain.exceptions.team.team_not_active_exception import TeamNotActiveException
from app.domain.exceptions.team.user_not_team_leader_exception import UserNotTeamLeaderException


@pytest.fixture
def mock_uow():
    uow = MagicMock()
    uow.__enter__.return_value = uow
    uow.__exit__.return_value = None
    uow.user_repo = MagicMock()
    uow.team_repo = MagicMock()
    uow.rank_repo = MagicMock()
    uow.region_repo = MagicMock()
    return uow


def test_update_team_success(mock_uow):
    use_case = UpdateTeam(mock_uow)

    vg = Videogame(1, "LoL", "/icon", True)
    region = Region(1, "LAS", vg)
    role = Role(1, "Mid", vg, "")
    min_r = Rank(1, "B", 1000, vg, "")
    max_r = Rank(2, "S", 2000, vg, "")

    leader = User(1, "leader", "Leader", "a@a.com", "p", UserRole.PLAYER, [])
    gp = GameProfile(1, 1, vg, [], [RoleProfile(1, role, Rank(1, "B", 1500, vg, ""))], region)
    leader.profiles.append(gp)

    team = Team(
        team_id=1,
        name="Team Old",
        allow_other_regions=False,
        videogame=vg,
        region=region,
        min_rank=min_r,
        max_rank=max_r,
        conversation=Conversation(1, [], [], ConversationTypeEnum.GROUP, name="Chat del equipo Team Old"),
        members=[TeamMemberRole(1, TeamRoleEnum.OWNER, 1, leader, role)]
    )

    mock_uow.user_repo.get_user_by_id.return_value = leader
    mock_uow.team_repo.get_by_id_for_update.return_value = team
    mock_uow.team_repo.update_team.side_effect = lambda t: t
    mock_uow.rank_repo.get_rank_by_id.side_effect = lambda rid: min_r if rid == 1 else max_r
    mock_uow.region_repo.get_region_by_id.return_value = region

    req = UpdateTeamRequest(
        name="Team Updated",
        description="New description",
        allow_other_regions=True,
        region_id=1,
        min_rank_id=1,
        max_rank_id=2
    )

    res = use_case.execute(1, 1, req)

    assert res.status == "success"
    assert "Team Updated" in res.message
    assert res.data.team_name == "Team Updated"
    assert res.data.description == "New description"
    assert res.data.allow_other_regions is True


def test_update_team_not_found(mock_uow):
    use_case = UpdateTeam(mock_uow)
    mock_uow.user_repo.get_user_by_id.return_value = User(1, "u", "u", "a", "p", UserRole.PLAYER, [])
    mock_uow.team_repo.get_by_id_for_update.return_value = None

    req = UpdateTeamRequest(name="T", allow_other_regions=True, min_rank_id=1, max_rank_id=2)
    with pytest.raises(TeamNotFoundException):
        use_case.execute(99, 1, req)


def test_update_team_not_active(mock_uow):
    use_case = UpdateTeam(mock_uow)
    vg = Videogame(1, "LoL", "/icon", True)
    min_r = Rank(1, "B", 1000, vg, "")
    max_r = Rank(2, "S", 2000, vg, "")
    team = Team(1, "T", True, vg, None, min_r, max_r, Conversation(1, [], []), [], is_active=False)

    mock_uow.user_repo.get_user_by_id.return_value = User(1, "u", "u", "a", "p", UserRole.PLAYER, [])
    mock_uow.team_repo.get_by_id_for_update.return_value = team

    req = UpdateTeamRequest(name="T", allow_other_regions=True, min_rank_id=1, max_rank_id=2)
    with pytest.raises(TeamNotActiveException):
        use_case.execute(1, 1, req)


def test_update_team_not_leader(mock_uow):
    use_case = UpdateTeam(mock_uow)
    vg = Videogame(1, "LoL", "/icon", True)
    role = Role(1, "Mid", vg, "")
    min_r = Rank(1, "B", 1000, vg, "")
    max_r = Rank(2, "S", 2000, vg, "")

    owner = User(1, "owner", "Owner", "a@a.com", "p", UserRole.PLAYER, [])
    other_user = User(2, "other", "Other", "b@b.com", "p", UserRole.PLAYER, [])

    team = Team(
        team_id=1, name="T", allow_other_regions=True, videogame=vg, region=None, min_rank=min_r, max_rank=max_r,
        conversation=Conversation(1, [], []),
        members=[TeamMemberRole(1, TeamRoleEnum.OWNER, 1, owner, role)]
    )

    mock_uow.user_repo.get_user_by_id.return_value = other_user
    mock_uow.team_repo.get_by_id_for_update.return_value = team

    req = UpdateTeamRequest(name="T", allow_other_regions=True, min_rank_id=1, max_rank_id=2)
    with pytest.raises(UserNotTeamLeaderException):
        use_case.execute(1, 2, req)
