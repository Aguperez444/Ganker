import pytest
from unittest.mock import MagicMock
from app.application.use_cases.join_team import JoinTeam
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

@pytest.fixture
def mock_uow():
    uow = MagicMock()
    uow.__enter__.return_value = uow
    uow.__exit__.return_value = None
    uow.user_repo = MagicMock()
    uow.team_repo = MagicMock()
    return uow

def test_join_team_success(mock_uow):
    use_case = JoinTeam(mock_uow)

    vg = Videogame(1, "LoL", "/icon", True)
    region = Region(1, "LAS", vg)
    role = Role(1, "Mid", vg, "")
    min_r = Rank(1, "B", 1000, vg, "")
    max_r = Rank(2, "S", 2000, vg, "")

    user = User(1, "u", "u", "a", "p", UserRole.PLAYER, [])
    gp = GameProfile(1, 1, vg, [], [RoleProfile(1, role, Rank(1, "B", 1500, vg, ""))], region)
    user.profiles.append(gp)

    team = Team(
        team_id=1, name="T", allow_other_regions=False, videogame=vg, region=region, min_rank=min_r, max_rank=max_r,
        conversation=Conversation(1, [], [], ConversationTypeEnum.GROUP),
        members=[TeamMemberRole(1, TeamRoleEnum.MEMBER, 1, None, role)]
    )

    mock_uow.user_repo.get_user_by_id.return_value = user
    mock_uow.team_repo.get_by_id_for_update.return_value = team
    mock_uow.team_repo.update_team_members.return_value = team

    res = use_case.execute(1, 1, 1)

    assert res.player_count == 1
    assert res.max_players == 1
    assert team.members[0].user == user
