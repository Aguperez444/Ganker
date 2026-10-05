from typing import Optional, List, TYPE_CHECKING

from app.domain.exceptions.entity_not_persisted_exception import EntityNotPersistedException
from app.domain.exceptions.game_profile.game_profile_not_found_exception import GameProfileNotFoundException
from app.domain.exceptions.invalid_id_exception import InvalidIdException
from app.domain.exceptions.team.InvalidRegionException import InvalidRegionException
from app.domain.exceptions.team.invalid_rank_exception import InvalidrankException
from app.domain.exceptions.team.invalid_role_profile_exception import InvalidRoleProfileException
from app.domain.exceptions.team.role_already_ocupied_exception import RoleAlreadyOcupiedException
from app.domain.exceptions.team.team_is_full_exception import TeamIsAlreadyFullException
from app.domain.exceptions.team.team_member_slot_not_found_exception import TeamMemberSlotNotFoundException
from app.domain.exceptions.team.user_already_in_team_exception import UserAlreadyInTeamException
from app.domain.models.conversation_member import ConversationMember


if TYPE_CHECKING:
    from app.domain.models.videogame import Videogame
    from app.domain.models.region import Region
    from app.domain.models.rank import Rank
    from app.domain.models.conversation import Conversation
    from app.domain.models.team_member_role import TeamMemberRole
    from app.domain.models.user import User
    from app.domain.models.game_profile import GameProfile


class Team:
    # noinspection bad-assignment
    def __init__(self,
                 team_id: Optional[int],
                 name: str,
                 allow_other_regions: bool,
                 videogame: 'Videogame',
                 region: Optional['Region'],
                 min_rank: 'Rank',
                 max_rank: 'Rank',
                 conversation: 'Conversation',
                 members: List['TeamMemberRole'] = None,
                 description: Optional[str] = None):
        self._team_id: int|None = team_id
        self._name: str = name
        self._description: Optional[str] = description
        self._allow_other_regions: bool = bool(allow_other_regions) if allow_other_regions is not None else False
        self._videogame: 'Videogame' = videogame
        self._region: 'Region' = region
        self._min_rank: 'Rank' = min_rank
        self._max_rank: 'Rank' = max_rank
        self._conversation: 'Conversation' = conversation
        self._members: list['TeamMemberRole'] = members if members is not None else []

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
    def description(self) -> Optional[str]:
        return self._description
    @description.setter
    def description(self, value: Optional[str]):
        self._description = value

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
    def region(self) -> Optional['Region']:
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

    def is_full(self) -> bool:
        for member in self._members:
            if member.user is None:
                return False
        return True

    def has_member(self, user_id: int) -> bool:
        return any(member.user is not None and member.user.user_id == user_id for member in self._members)

    def get_member_slot_by_id(self, team_member_slot_id: int) -> Optional['TeamMemberRole']:
        for member in self._members:
            if member.game_role.role_id == team_member_slot_id:
                return member
        return None

    def add_member(self, new_user: 'User', target_team_member_slot_id: int) -> None:
        # Validar que el equipo no esté lleno
        if self.is_full():
            raise TeamIsAlreadyFullException(self.team_id)

        # Validar que el jugador no sea ya miembro del equipo
        if self.has_member(new_user.user_id):
            raise UserAlreadyInTeamException(self.team_id, new_user.user_id)

        user_game_profile: Optional['GameProfile'] = new_user.get_game_profile_by_videogame(self.videogame)
        if user_game_profile is None:
            raise GameProfileNotFoundException(new_user.user_id, self.videogame.videogame_id)


        target_slot = self.get_member_slot_by_id(target_team_member_slot_id)
        if not target_slot:
            raise TeamMemberSlotNotFoundException(target_team_member_slot_id, self.team_id)
        if target_slot.user is not None:
            raise RoleAlreadyOcupiedException(target_slot.game_role.role_id, self.team_id)

        user_role_profile = user_game_profile.get_role_profile_by_role(target_slot.game_role)
        if not user_role_profile:
            raise InvalidRoleProfileException(target_slot.game_role.role_id, user_game_profile.game_profile_id)

        # Validar que el jugador cumpla con los requisitos del equipo
        if not self.allow_other_regions and user_game_profile.region.region_id is not None and user_game_profile.region.region_id != self.region.region_id:
            raise InvalidRegionException(self.region.region_id, user_game_profile.region.region_id)

        if user_role_profile.rank.value < self.min_rank.value or user_role_profile.rank.value > self.max_rank.value:
            raise InvalidrankException(self.team_id, user_role_profile.rank.rank_id, user_role_profile.rank.value, self.min_rank.value, self.max_rank.value)

        target_slot.user = new_user

        # Agregar al usuario a la conversación del equipo
        self.conversation.members.append(ConversationMember(
            conversation_member_id=None,
            conversation_id=self.conversation.conversation_id,
            user=new_user
        ))



