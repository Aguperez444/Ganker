import pytest
from app.domain.models.team import Team
from app.domain.models.videogame import Videogame
from app.domain.models.rank import Rank
from app.domain.models.conversation import Conversation
from app.domain.models.conversation_type_enum import ConversationTypeEnum
from app.domain.exceptions.team.team_without_region_must_allow_others_exception import TeamWithoutRegionMustAllowOthersException

def test_team_without_region_must_allow_others():
    vg = Videogame(1, "LoL", "/icon", True)
    min_r = Rank(1, "B", 1000, vg, "")
    max_r = Rank(2, "S", 2000, vg, "")
    conv = Conversation(1, [], [], ConversationTypeEnum.GROUP)

    # Should raise exception if region is None and allow_other_regions is False
    with pytest.raises(TeamWithoutRegionMustAllowOthersException):
        Team(
            team_id=1,
            name="Test",
            allow_other_regions=False,
            videogame=vg,
            region=None,
            min_rank=min_r,
            max_rank=max_r,
            conversation=conv
        )

    # Should NOT raise exception if region is None and allow_other_regions is True
    team2 = Team(
        team_id=2,
        name="Test 2",
        allow_other_regions=True,
        videogame=vg,
        region=None,
        min_rank=min_r,
        max_rank=max_r,
        conversation=conv
    )
    assert team2.allow_other_regions is True
