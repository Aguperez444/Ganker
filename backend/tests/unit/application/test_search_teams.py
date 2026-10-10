import pytest
from unittest.mock import MagicMock
from app.application.use_cases.search_teams import SearchTeams
from app.domain.models.team import Team
from app.domain.models.videogame import Videogame
from app.domain.models.region import Region
from app.domain.models.rank import Rank
from app.domain.models.role import Role
from app.domain.models.conversation import Conversation
from app.domain.models.conversation_type_enum import ConversationTypeEnum
from app.domain.models.team_member_role import TeamMemberRole
from app.domain.models.team_role_enum import TeamRoleEnum

@pytest.fixture
def mock_uow():
    uow = MagicMock()
    uow.__enter__.return_value = uow
    uow.__exit__.return_value = None
    uow.team_repo = MagicMock()
    return uow

def test_search_teams(mock_uow):
    use_case = SearchTeams(mock_uow)

    vg = Videogame(1, "LoL", "/icon", True)
    region = Region(1, "LAS", vg)
    min_r = Rank(1, "B", 1000, vg, "")
    max_r = Rank(2, "S", 2000, vg, "")
    role = Role(1, "Mid", vg, "")

    team1 = Team(
        team_id=1,
        name="Team 1",
        description="Desc 1",
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

    mock_uow.team_repo.search_teams.return_value = [team1]

    results = use_case.execute(videogame_id=1, search="Team 1")

    assert len(results) == 1
    assert results[0].team_name == "Team 1"
    assert results[0].description == "Desc 1"
    assert results[0].max_players == 1
    mock_uow.team_repo.search_teams.assert_called_once_with(
        videogame_id=1, region_id=None, rank_id=None, vacant_slots=None, role_id=None, search_term="Team 1", limit=None, offset=0
    )

def test_search_teams_empty(mock_uow):
    use_case = SearchTeams(mock_uow)
    mock_uow.team_repo.search_teams.return_value = []

    results = use_case.execute()

    assert len(results) == 0
