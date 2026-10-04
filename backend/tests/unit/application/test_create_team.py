import pytest
from unittest.mock import MagicMock
from app.application.use_cases.create_team import CreateTeam
from app.infrastructure.api.dto.request.create_team_request import CreateTeamRequest
from app.domain.models.user import User
from app.domain.models.videogame import Videogame
from app.domain.models.region import Region
from app.domain.models.rank import Rank
from app.domain.models.role import Role
from app.domain.models.user_role import UserRole
from app.domain.models.game_profile import GameProfile
from app.domain.models.role_profile import RoleProfile
from app.domain.exceptions.team.user_already_in_team_exception import UserAlreadyInTeamException
from app.domain.exceptions.team.invalid_rank_exception import InvalidrankException
from app.domain.models.team import Team

@pytest.fixture
def mock_uow():
    uow = MagicMock()
    uow.__enter__.return_value = uow
    uow.__exit__.return_value = None
    uow.user_repo = MagicMock()
    uow.videogame_repo = MagicMock()
    uow.region_repo = MagicMock()
    uow.rank_repo = MagicMock()
    uow.team_repo = MagicMock()
    uow.role_repo = MagicMock()
    return uow

def test_create_team_success(mock_uow):
    use_case = CreateTeam(mock_uow)
    
    vg = Videogame(1, "LoL", "/icon", True)
    region = Region(1, "LAS", vg)
    min_r = Rank(1, "B", 1000, vg, "")
    max_r = Rank(2, "S", 2000, vg, "")
    role = Role(1, "Mid", vg, "")

    user = User(1, "u", "u", "a", "p", UserRole.PLAYER, [])
    gp = GameProfile(1, 1, vg, [], [RoleProfile(1, role, Rank(1, "B", 1500, vg, ""))], region)
    user.profiles.append(gp)

    mock_uow.user_repo.get_user_by_id.return_value = user
    mock_uow.videogame_repo.get_videogame_by_id.return_value = vg
    mock_uow.region_repo.get_by_id.return_value = region
    mock_uow.rank_repo.get_rank_by_id.side_effect = lambda rid: min_r if rid == 1 else max_r
    mock_uow.role_repo.get_role_by_id.return_value = role
    mock_uow.team_repo.is_user_in_any_active_team.return_value = False

    def side_effect_create(t):
        t.team_id = 1
        return t
    mock_uow.team_repo.create_team.side_effect = side_effect_create

    req = CreateTeamRequest(
        name="Team A",
        allow_other_regions=False,
        videogame_id=1,
        region_id=1,
        min_rank_id=1,
        max_rank_id=2,
        creator_game_role_id=1,
        vacant_game_role_ids=[1]
    )

    result = use_case.execute(1, req)
    
    assert result.team_id == 1
    assert result.team_name == "Team A"
    assert result.player_count == 1
    assert result.max_players == 2

def test_create_team_already_in_team(mock_uow):
    use_case = CreateTeam(mock_uow)
    mock_uow.user_repo.get_user_by_id.return_value = User(1, "u", "u", "a", "p", UserRole.PLAYER, [])
    mock_uow.videogame_repo.get_videogame_by_id.return_value = Videogame(1, "LoL", "/icon", True)
    mock_uow.region_repo.get_by_id.return_value = Region(1, "LAS", Videogame(1, "LoL", "/icon", True))
    mock_uow.rank_repo.get_rank_by_id.return_value = Rank(1, "B", 1000, Videogame(1, "LoL", "/icon", True), "")
    
    mock_uow.team_repo.is_user_in_any_active_team.return_value = True

    req = CreateTeamRequest(name="A", allow_other_regions=False, videogame_id=1, region_id=1, min_rank_id=1, max_rank_id=1, creator_game_role_id=1, vacant_game_role_ids=[])

    with pytest.raises(UserAlreadyInTeamException):
        use_case.execute(1, req)
