import pytest
from app.domain.models.team import Team
from app.domain.models.user import User
from app.domain.models.videogame import Videogame
from app.domain.models.region import Region
from app.domain.models.rank import Rank
from app.domain.models.role import Role
from app.domain.models.game_profile import GameProfile
from app.domain.models.role_profile import RoleProfile
from app.domain.models.team_member_role import TeamMemberRole
from app.domain.models.conversation import Conversation
from app.domain.models.conversation_type_enum import ConversationTypeEnum
from app.domain.models.user_role import UserRole
from app.domain.models.team_role_enum import TeamRoleEnum

from app.domain.exceptions.team.invalid_rank_exception import InvalidrankException
from app.domain.exceptions.team.InvalidRegionException import InvalidRegionException
from app.domain.exceptions.team.team_is_full_exception import TeamIsAlreadyFullException
from app.domain.exceptions.team.user_already_in_team_exception import UserAlreadyInTeamException


@pytest.fixture
def base_setup():
    vg = Videogame(1, "LoL", "/icon", True)
    region_team = Region(1, "LAS", vg)
    region_other = Region(2, "LAN", vg)
    
    min_r = Rank(1, "Bronze", 1000, vg, "/b")
    max_r = Rank(3, "Gold", 3000, vg, "/g")
    
    role = Role(1, "Mid", vg, "/mid")
    
    conv = Conversation(1, [], [], ConversationTypeEnum.GROUP)
    
    team = Team(
        team_id=1,
        name="Team A",
        allow_other_regions=False,
        videogame=vg,
        region=region_team,
        min_rank=min_r,
        max_rank=max_r,
        conversation=conv,
        members=[
            TeamMemberRole(1, TeamRoleEnum.OWNER, 1, None, role),
            TeamMemberRole(2, TeamRoleEnum.MEMBER, 1, None, role)
        ]
    )

    user = User(
        user_id=1,
        username="u1",
        name="U 1",
        mail="a@a.com",
        password_hash="pw",
        role=UserRole.PLAYER,
        profiles=[]
    )
    
    return team, user, vg, region_team, region_other, role, min_r, max_r

def test_add_member_success(base_setup):
    team, user, vg, region_team, _, role, min_r, max_r = base_setup
    rank_valid = Rank(2, "Silver", 2000, vg, "/s")
    
    gp = GameProfile(1, 1, vg, [], [RoleProfile(1, role, rank_valid)], region_team)
    user.profiles.append(gp)

    team.add_member(user, 1) # add to slot 1

    assert team.members[0].user == user
    assert len(team.conversation.members) == 1
    assert team.conversation.members[0].user == user

def test_add_member_team_full(base_setup):
    team, user, vg, region_team, _, role, _, _ = base_setup
    user2 = User(2, "u2", "u2", "a", "p", UserRole.PLAYER, [])
    team.members[0].user = user2
    team.members[1].user = user2
    
    with pytest.raises(TeamIsAlreadyFullException):
        team.add_member(user, 1)

def test_add_member_invalid_rank(base_setup):
    team, user, vg, region_team, _, role, min_r, max_r = base_setup
    rank_invalid = Rank(4, "Diamond", 4000, vg, "/d") # > 3000
    
    gp = GameProfile(1, 1, vg, [], [RoleProfile(1, role, rank_invalid)], region_team)
    user.profiles.append(gp)

    with pytest.raises(InvalidrankException):
        team.add_member(user, 1)

def test_add_member_invalid_region(base_setup):
    team, user, vg, _, region_other, role, _, _ = base_setup
    rank_valid = Rank(2, "Silver", 2000, vg, "/s")
    
    gp = GameProfile(1, 1, vg, [], [RoleProfile(1, role, rank_valid)], region_other)
    user.profiles.append(gp)

    with pytest.raises(InvalidRegionException):
        team.add_member(user, 1)

def test_add_member_valid_region_if_allow_other(base_setup):
    team, user, vg, _, region_other, role, _, _ = base_setup
    team.allow_other_regions = True
    rank_valid = Rank(2, "Silver", 2000, vg, "/s")
    
    gp = GameProfile(1, 1, vg, [], [RoleProfile(1, role, rank_valid)], region_other)
    user.profiles.append(gp)

    team.add_member(user, 1) # should not raise exception
    assert team.members[0].user == user

def test_add_member_already_in_team(base_setup):
    team, user, vg, region_team, _, role, _, _ = base_setup
    rank_valid = Rank(2, "Silver", 2000, vg, "/s")
    
    gp = GameProfile(1, 1, vg, [], [RoleProfile(1, role, rank_valid)], region_team)
    user.profiles.append(gp)

    team.members[0].user = user

    with pytest.raises(UserAlreadyInTeamException):
        team.add_member(user, 2)
