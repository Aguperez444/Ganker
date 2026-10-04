from typing import Optional, List, TYPE_CHECKING

from app.domain.exceptions.entity_not_persisted_exception import EntityNotPersistedException
from app.domain.exceptions.invalid_id_exception import InvalidIdException

if TYPE_CHECKING:
    from app.domain.models.videogame import Videogame
    from app.domain.models.region import Region
    from app.domain.models.rank import Rank
    from app.domain.models.conversation import Conversation
    from app.domain.models.team_member_role import TeamMemberRole


class Team:
    # noinspection bad-assignment
    def __init__(self,
                 team_id: Optional[int],
                 name: str,
                 allow_other_regions: bool,
                 videogame: 'Videogame',
                 region: 'Region',
                 min_rank: 'Rank',
                 max_rank: 'Rank',
                 conversation: 'Conversation',
                 members: List['TeamMemberRole'] = None):
        self._team_id = team_id
        self._name = name
        self._allow_other_regions = bool(allow_other_regions) if allow_other_regions is not None else False
        self._videogame = videogame
        self._region = region
        self._min_rank = min_rank
        self._max_rank = max_rank
        self._conversation = conversation
        self._members = members if members is not None else []

    @property
    def team_id(self) -> int:
        if self._team_id is None:
            raise EntityNotPersistedException("Team")
        return self._team_id
    @team_id.setter
    def team_id(self, value: int):
        if isinstance(value, bool) or not isinstance(value, int):
            raise InvalidIdException(value)
        self._team_id = value

    @property
    def name(self) -> str:
        return self._name
    @name.setter
    def name(self, value: str):
        self._name = value

    @property
    def allow_other_regions(self) -> bool:
        return self._allow_other_regions
    @allow_other_regions.setter
    def allow_other_regions(self, value: bool):
        self._allow_other_regions = value
        
    @property
    def videogame(self) -> 'Videogame':
        return self._videogame
    @videogame.setter
    def videogame(self, value: 'Videogame'):
        self._videogame = value

    @property
    def region(self) -> 'Region':
        return self._region
    @region.setter
    def region(self, value: 'Region'):
        self._region = value

    @property
    def min_rank(self) -> 'Rank':
        return self._min_rank
    @min_rank.setter
    def min_rank(self, value: 'Rank'):
        self._min_rank = value

    @property
    def max_rank(self) -> 'Rank':
        return self._max_rank
    @max_rank.setter
    def max_rank(self, value: 'Rank'):
        self._max_rank = value

    @property
    def conversation(self) -> 'Conversation':
        return self._conversation
    @conversation.setter
    def conversation(self, value: 'Conversation'):
        self._conversation = value

    @property
    def members(self) -> List['TeamMemberRole']:
        return self._members
    @members.setter
    def members(self, value: List['TeamMemberRole']):
        self._members = value

    def __eq__(self, other: object) -> bool:
        if isinstance(other, Team):
            return self._team_id is not None and self._team_id == other._team_id
        return False

    def is_persisted(self) -> bool:
        return self._team_id is not None

    def __repr__(self) -> str:
        return f"Team(team_id={self.team_id if self.is_persisted() else 'sin_id'}, name='{self.name}', allow_other_regions={self.allow_other_regions})"
