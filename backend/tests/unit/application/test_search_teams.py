import pytest
from unittest.mock import MagicMock
from app.application.use_cases.search_teams import SearchTeams
from app.domain.models.team import Team
from app.domain.models.videogame import Videogame
from app.domain.models.region import Region
from app.domain.models.rank import Rank
from app.domain.models.role import Role
from app.domain.models.user import User
from app.domain.models.user_role import UserRole
from app.domain.models.conversation import Conversation
from app.domain.models.conversation_type_enum import ConversationTypeEnum
from app.domain.models.team_member_role import TeamMemberRole
from app.domain.models.team_role_enum import TeamRoleEnum
from app.domain.exceptions.invalid_id_exception import InvalidIdException
from app.domain.exceptions.does_not_belong_to_game_exception import DoesNotBelongToGameException
from app.domain.exceptions.videogame.videogame_not_found_exception import VideogameNotFoundException
from app.domain.exceptions.region.region_not_found_exception import RegionNotFoundException
from app.domain.exceptions.rank.rank_not_found_exception import RankNotFoundException
from app.domain.exceptions.role.role_not_found_exception import RoleNotFoundException
from app.domain.exceptions.user.user_not_found_exception import UserNotFoundException
from app.domain.specifications.base import AndSpecification
from app.domain.specifications.team.is_active_specification import ByIsActiveSpecification
from app.domain.specifications.videogame_specification import ByVideogameSpecification
from app.domain.specifications.regions_specification import ByRegionsSpecification
from app.domain.specifications.ranks_specification import ByRanksSpecification
from app.domain.specifications.team.vacant_slots_specification import ByVacantSlotsSpecification
from app.domain.specifications.roles_specification import ByRolesSpecification
from app.domain.specifications.team.search_terms_specification import BySearchTermsSpecification


def extract_specs(spec):
    if isinstance(spec, AndSpecification):
        return extract_specs(spec.left) + extract_specs(spec.right)
    return [spec]


@pytest.fixture
def mock_uow():
    uow = MagicMock()
    uow.__enter__.return_value = uow
    uow.__exit__.return_value = None
    uow.videogame_repo = MagicMock()
    uow.region_repo = MagicMock()
    uow.rank_repo = MagicMock()
    uow.role_repo = MagicMock()
    uow.user_repo = MagicMock()
    uow.team_repo = MagicMock()
    uow.find_by_specification_repo = MagicMock()
    return uow


@pytest.fixture
def sample_team():
    vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon", rank_per_role=True, has_characters=True)
    region = Region(region_id=1, name="LAS", videogame=vg)
    min_r = Rank(rank_id=1, name="Bronze", value=1000, videogame=vg, icon_url="")
    max_r = Rank(rank_id=2, name="Silver", value=2000, videogame=vg, icon_url="")
    role = Role(role_id=1, name="Mid", videogame=vg, icon_url="")

    return Team(
        team_id=1,
        name="Team Alpha",
        description="Team Alpha description",
        allow_other_regions=False,
        videogame=vg,
        region=region,
        min_rank=min_r,
        max_rank=max_r,
        conversation=Conversation(1, [], [], ConversationTypeEnum.GROUP, "Chat 1"),
        members=[
            TeamMemberRole(1, TeamRoleEnum.MEMBER, 1, None, role)
        ]
    )


def test_search_teams_basic_with_specifications(mock_uow, sample_team):
    use_case = SearchTeams(mock_uow)
    vg = sample_team.videogame
    mock_uow.videogame_repo.get_videogame_by_id.return_value = vg
    mock_uow.find_by_specification_repo.get_teams.return_value = [sample_team]

    results = use_case.execute(videogame_id=1)

    assert len(results) == 1
    assert results[0].team_name == "Team Alpha"
    assert results[0].description == "Team Alpha description"
    mock_uow.videogame_repo.get_videogame_by_id.assert_called_once_with(1)
    mock_uow.find_by_specification_repo.get_teams.assert_called_once()

    called_spec, offset, limit = mock_uow.find_by_specification_repo.get_teams.call_args[0]
    assert offset == 0
    assert limit == 5

    leaf_specs = extract_specs(called_spec)
    assert any(isinstance(s, ByIsActiveSpecification) and s.to_expression() is True for s in leaf_specs)
    assert any(isinstance(s, ByVideogameSpecification) and s.to_expression() == 1 for s in leaf_specs)


def test_search_teams_empty_result(mock_uow, sample_team):
    use_case = SearchTeams(mock_uow)
    mock_uow.videogame_repo.get_videogame_by_id.return_value = sample_team.videogame
    mock_uow.find_by_specification_repo.get_teams.return_value = []

    results = use_case.execute(videogame_id=1)

    assert len(results) == 0


def test_search_teams_with_all_filters_combines_specifications(mock_uow, sample_team):
    use_case = SearchTeams(mock_uow)
    vg = sample_team.videogame
    region = Region(region_id=10, name="LAS", videogame=vg)
    rank = Rank(rank_id=20, name="Gold", value=1500, videogame=vg, icon_url="")
    role = Role(role_id=30, name="Mid", videogame=vg, icon_url="")

    mock_uow.videogame_repo.get_videogame_by_id.return_value = vg
    mock_uow.region_repo.get_region_by_id.return_value = region
    mock_uow.rank_repo.get_rank_by_id.return_value = rank
    mock_uow.role_repo.get_role_by_id.return_value = role
    mock_uow.find_by_specification_repo.get_teams.return_value = [sample_team]

    results = use_case.execute(
        videogame_id=1,
        region_id=10,
        rank_id=20,
        vacant_slots=2,
        role_id=30,
        search="Alpha",
        limit=10,
        offset=20
    )

    assert len(results) == 1
    mock_uow.find_by_specification_repo.get_teams.assert_called_once()
    called_spec, offset, limit = mock_uow.find_by_specification_repo.get_teams.call_args[0]
    assert offset == 20
    assert limit == 10

    leaf_specs = extract_specs(called_spec)
    assert any(isinstance(s, ByIsActiveSpecification) and s.to_expression() is True for s in leaf_specs)
    assert any(isinstance(s, ByVideogameSpecification) and s.to_expression() == 1 for s in leaf_specs)
    assert any(isinstance(s, ByRegionsSpecification) and s.to_expression() == 10 for s in leaf_specs)
    assert any(isinstance(s, ByRanksSpecification) and s.to_expression() == 1500 for s in leaf_specs)
    assert any(isinstance(s, ByVacantSlotsSpecification) and s.to_expression() == 2 for s in leaf_specs)
    assert any(isinstance(s, ByRolesSpecification) and s.to_expression() == [30] for s in leaf_specs)
    assert any(isinstance(s, BySearchTermsSpecification) and s.terms == "Alpha" and s.to_expression() == "%Alpha%" for s in leaf_specs)


def test_search_teams_with_viewer_user_id(mock_uow, sample_team):
    use_case = SearchTeams(mock_uow)
    mock_uow.videogame_repo.get_videogame_by_id.return_value = sample_team.videogame
    mock_uow.find_by_specification_repo.get_teams.return_value = [sample_team]

    viewer = User(
        user_id=42,
        username="viewer_user",
        name="Viewer",
        mail="viewer@test.com",
        password_hash="hash",
        role=UserRole.PLAYER,
        profiles=[]
    )
    mock_uow.user_repo.get_user_by_id.return_value = viewer
    mock_uow.team_repo.is_user_in_any_active_team.return_value = True

    results = use_case.execute(videogame_id=1, user_id=42)

    assert len(results) == 1
    mock_uow.user_repo.get_user_by_id.assert_called_once_with(42)
    mock_uow.team_repo.is_user_in_any_active_team.assert_called_once_with(42)
    assert results[0].consultant_player_info is not None
    assert results[0].consultant_player_info.join_eligibility.can_join is False


def test_search_teams_missing_videogame_id_raises_invalid_id(mock_uow):
    use_case = SearchTeams(mock_uow)
    with pytest.raises(InvalidIdException):
        use_case.execute(videogame_id=None)

    with pytest.raises(InvalidIdException):
        use_case.execute(videogame_id=0)


def test_search_teams_videogame_not_found(mock_uow):
    use_case = SearchTeams(mock_uow)
    mock_uow.videogame_repo.get_videogame_by_id.return_value = None

    with pytest.raises(VideogameNotFoundException):
        use_case.execute(videogame_id=999)


def test_search_teams_region_does_not_belong_to_game(mock_uow, sample_team):
    use_case = SearchTeams(mock_uow)
    other_vg = Videogame(videogame_id=2, name="Dota", icon_url="", rank_per_role=True, has_characters=True)
    other_region = Region(region_id=10, name="EU", videogame=other_vg)

    mock_uow.videogame_repo.get_videogame_by_id.return_value = sample_team.videogame
    mock_uow.region_repo.get_region_by_id.return_value = other_region

    with pytest.raises(DoesNotBelongToGameException) as exc_info:
        use_case.execute(videogame_id=1, region_id=10)

    assert exc_info.value.status_code == 400


def test_search_teams_region_not_found(mock_uow, sample_team):
    use_case = SearchTeams(mock_uow)
    mock_uow.videogame_repo.get_videogame_by_id.return_value = sample_team.videogame
    mock_uow.region_repo.get_region_by_id.return_value = None

    with pytest.raises(RegionNotFoundException):
        use_case.execute(videogame_id=1, region_id=999)


def test_search_teams_rank_does_not_belong_to_game(mock_uow, sample_team):
    use_case = SearchTeams(mock_uow)
    other_vg = Videogame(videogame_id=2, name="Dota", icon_url="", rank_per_role=True, has_characters=True)
    other_rank = Rank(rank_id=20, name="Archon", value=1500, videogame=other_vg, icon_url="")

    mock_uow.videogame_repo.get_videogame_by_id.return_value = sample_team.videogame
    mock_uow.rank_repo.get_rank_by_id.return_value = other_rank

    with pytest.raises(DoesNotBelongToGameException) as exc_info:
        use_case.execute(videogame_id=1, rank_id=20)

    assert exc_info.value.status_code == 400


def test_search_teams_rank_not_found(mock_uow, sample_team):
    use_case = SearchTeams(mock_uow)
    mock_uow.videogame_repo.get_videogame_by_id.return_value = sample_team.videogame
    mock_uow.rank_repo.get_rank_by_id.return_value = None

    with pytest.raises(RankNotFoundException):
        use_case.execute(videogame_id=1, rank_id=999)


def test_search_teams_role_does_not_belong_to_game(mock_uow, sample_team):
    use_case = SearchTeams(mock_uow)
    other_vg = Videogame(videogame_id=2, name="Dota", icon_url="", rank_per_role=True, has_characters=True)
    other_role = Role(role_id=30, name="Carry", videogame=other_vg, icon_url="")

    mock_uow.videogame_repo.get_videogame_by_id.return_value = sample_team.videogame
    mock_uow.role_repo.get_role_by_id.return_value = other_role

    with pytest.raises(DoesNotBelongToGameException) as exc_info:
        use_case.execute(videogame_id=1, role_id=30)

    assert exc_info.value.status_code == 400


def test_search_teams_role_not_found(mock_uow, sample_team):
    use_case = SearchTeams(mock_uow)
    mock_uow.videogame_repo.get_videogame_by_id.return_value = sample_team.videogame
    mock_uow.role_repo.get_role_by_id.return_value = None

    with pytest.raises(RoleNotFoundException):
        use_case.execute(videogame_id=1, role_id=999)


def test_search_teams_user_not_found(mock_uow, sample_team):
    use_case = SearchTeams(mock_uow)
    mock_uow.videogame_repo.get_videogame_by_id.return_value = sample_team.videogame
    mock_uow.user_repo.get_user_by_id.return_value = None

    with pytest.raises(UserNotFoundException):
        use_case.execute(videogame_id=1, user_id=999)
