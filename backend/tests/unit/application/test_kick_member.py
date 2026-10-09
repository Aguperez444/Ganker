import pytest
from unittest.mock import MagicMock
from app.application.use_cases.kick_member import KickMember
from app.domain.models.user import User
from app.domain.models.videogame import Videogame
from app.domain.models.region import Region
from app.domain.models.rank import Rank
from app.domain.models.role import Role
from app.domain.models.user_role import UserRole
from app.domain.models.team import Team
from app.domain.models.team_member_role import TeamMemberRole
from app.domain.models.team_role_enum import TeamRoleEnum
from app.domain.models.conversation import Conversation
from app.domain.models.conversation_member import ConversationMember
from app.domain.models.conversation_member_role_enum import ConversationMemberRoleEnum
from app.domain.models.conversation_type_enum import ConversationTypeEnum
from app.domain.exceptions.team.user_not_team_leader_exception import UserNotTeamLeaderException
from app.domain.exceptions.team.leader_cannot_kick_self_exception import LeaderCannotKickSelfException


@pytest.fixture
def mock_uow():
    uow = MagicMock()
    uow.__enter__.return_value = uow
    uow.__exit__.return_value = None
    uow.user_repo = MagicMock()
    uow.team_repo = MagicMock()
    return uow


def test_kick_member_success(mock_uow):
    use_case = KickMember(mock_uow)

    vg = Videogame(1, "LoL", "/icon", True)
    region = Region(1, "LAS", vg)
    role = Role(1, "Mid", vg, "")
    min_r = Rank(1, "B", 1000, vg, "")
    max_r = Rank(2, "S", 2000, vg, "")

    owner = User(1, "owner", "Owner", "a@a.com", "p", UserRole.PLAYER, [])
    member = User(2, "member", "Member", "b@b.com", "p", UserRole.PLAYER, [])

    team = Team(
        team_id=1,
        name="Team Alpha",
        allow_other_regions=False,
        videogame=vg,
        region=region,
        min_rank=min_r,
        max_rank=max_r,
        conversation=Conversation(
            1,
            [
                ConversationMember(1, 1, owner, ConversationMemberRoleEnum.ADMIN),
                ConversationMember(2, 1, member, ConversationMemberRoleEnum.MEMBER)
            ],
            [],
            ConversationTypeEnum.GROUP
        ),
        members=[
            TeamMemberRole(1, TeamRoleEnum.OWNER, 1, owner, role),
            TeamMemberRole(2, TeamRoleEnum.MEMBER, 1, member, role)
        ]
    )

    mock_uow.user_repo.get_user_by_id.side_effect = lambda uid: owner if uid == 1 else member
    mock_uow.team_repo.get_by_id_for_update.return_value = team
    mock_uow.team_repo.update_team_members.side_effect = lambda t: t

    res = use_case.execute(1, 1, 2)

    assert res.status == "success"
    assert "expulsado exitosamente" in res.message
    assert res.data.player_count == 1
    assert team.members[1].user is None
    assert len(team.conversation.members) == 1


def test_kick_member_as_non_leader_fails(mock_uow):
    use_case = KickMember(mock_uow)
    vg = Videogame(1, "LoL", "/icon", True)
    role = Role(1, "Mid", vg, "")
    min_r = Rank(1, "B", 1000, vg, "")
    max_r = Rank(2, "S", 2000, vg, "")

    owner = User(1, "owner", "Owner", "a@a.com", "p", UserRole.PLAYER, [])
    member = User(2, "member", "Member", "b@b.com", "p", UserRole.PLAYER, [])

    team = Team(
        team_id=1, name="T", allow_other_regions=True, videogame=vg, region=None, min_rank=min_r, max_rank=max_r,
        conversation=Conversation(1, [], []),
        members=[TeamMemberRole(1, TeamRoleEnum.OWNER, 1, owner, role), TeamMemberRole(2, TeamRoleEnum.MEMBER, 1, member, role)]
    )

    mock_uow.user_repo.get_user_by_id.side_effect = lambda uid: member if uid == 2 else owner
    mock_uow.team_repo.get_by_id_for_update.return_value = team

    with pytest.raises(UserNotTeamLeaderException):
        use_case.execute(1, 2, 1)


def test_kick_member_self_fails(mock_uow):
    use_case = KickMember(mock_uow)
    vg = Videogame(1, "LoL", "/icon", True)
    role = Role(1, "Mid", vg, "")
    min_r = Rank(1, "B", 1000, vg, "")
    max_r = Rank(2, "S", 2000, vg, "")

    owner = User(1, "owner", "Owner", "a@a.com", "p", UserRole.PLAYER, [])

    team = Team(
        team_id=1, name="T", allow_other_regions=True, videogame=vg, region=None, min_rank=min_r, max_rank=max_r,
        conversation=Conversation(1, [], []),
        members=[TeamMemberRole(1, TeamRoleEnum.OWNER, 1, owner, role)]
    )

    mock_uow.user_repo.get_user_by_id.return_value = owner
    mock_uow.team_repo.get_by_id_for_update.return_value = team

    with pytest.raises(LeaderCannotKickSelfException):
        use_case.execute(1, 1, 1)
