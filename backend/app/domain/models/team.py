from typing import Optional, List, TYPE_CHECKING

from app.domain.exceptions.entity_not_persisted_exception import EntityNotPersistedException
from app.domain.exceptions.game_profile.game_profile_not_found_exception import GameProfileNotFoundException
from app.domain.exceptions.invalid_id_exception import InvalidIdException
from app.domain.exceptions.team.InvalidRegionException import InvalidRegionException
from app.domain.exceptions.team.invalid_rank_exception import InvalidrankException
from app.domain.exceptions.team.invalid_role_profile_exception import InvalidRoleProfileException
from app.domain.models.team_role_enum import TeamRoleEnum
from app.domain.exceptions.team.role_already_ocupied_exception import RoleAlreadyOcupiedException
from app.domain.exceptions.team.team_is_full_exception import TeamIsAlreadyFullException
from app.domain.exceptions.team.team_member_slot_not_found_exception import TeamMemberSlotNotFoundException
from app.domain.exceptions.team.user_already_in_team_exception import UserAlreadyInTeamException
from app.domain.exceptions.team.team_not_active_exception import TeamNotActiveException
from app.domain.exceptions.team.team_without_region_must_allow_others_exception import TeamWithoutRegionMustAllowOthersException
from app.domain.exceptions.team.invalid_rank_range_exception import InvalidRankRangeException
from app.domain.exceptions.team.catalog_item_videogame_mismatch_exception import CatalogItemVideogameMismatchException
from app.domain.exceptions.team.leader_cannot_leave_team_exception import LeaderCannotLeaveTeamException
from app.domain.exceptions.team.leader_cannot_kick_self_exception import LeaderCannotKickSelfException
from app.domain.exceptions.team.user_not_in_team_exception import UserNotInTeamException
from app.domain.exceptions.team.user_not_team_leader_exception import UserNotTeamLeaderException
from app.domain.exceptions.domain_exception import DomainException
from app.domain.models.conversation_member import ConversationMember
from app.domain.models.conversation_member_role_enum import ConversationMemberRoleEnum
from app.domain.services.static_validation_service import StaticValidationService

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
                 description: Optional[str] = None,
                 icon_url: Optional[str] = None,
                 is_active: bool = True):
        self._team_id: int|None = team_id
        self._name: str = name
        self._description: Optional[str] = description
        self._allow_other_regions: bool = bool(allow_other_regions) if allow_other_regions is not None else False
        self._icon_url: Optional[str] = icon_url
        self._is_active: bool = True if is_active is None else bool(is_active)
        self._videogame: 'Videogame' = videogame
        self._region: Optional['Region'] = region
        
        if self._region is None and not self._allow_other_regions:
            raise TeamWithoutRegionMustAllowOthersException()
            
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
    def icon_url(self) -> Optional[str]:
        return self._icon_url
    @icon_url.setter
    def icon_url(self, value: Optional[str]):
        self._icon_url = value

    @property
    def is_active(self) -> bool:
        return self._is_active
    @is_active.setter
    def is_active(self, value: bool):
        self._is_active = value

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
        return not any(member.user is None for member in self._members)

    def vacant_slots(self) -> List['TeamMemberRole']:
        return [member for member in self._members if member.user is None]

    def has_member(self, user_id: int) -> bool:
        return any(member.user is not None and member.user.user_id == user_id for member in self._members)

    def is_leader(self, user_id: int) -> bool:
        return any(member.user is not None and member.user.user_id == user_id
                   and member.team_role == TeamRoleEnum.OWNER for member in self._members)

    def get_member_slot_by_id(self, team_member_slot_id: int) -> Optional['TeamMemberRole']:
        """Busca un slot del equipo por el ID del slot (team_member_role_id)."""
        for member in self._members:
            if member.is_persisted() and member.team_member_role_id == team_member_slot_id:
                return member
        return None

    def _validate_user_for_slot(self, user: 'User', slot: 'TeamMemberRole') -> None:
        """Valida que el usuario cumpla los requisitos del equipo para ocupar un slot vacante. Lanza DomainException si no."""
        user_game_profile: Optional['GameProfile'] = user.get_game_profile_by_videogame(self.videogame)
        if user_game_profile is None:
            raise GameProfileNotFoundException(None, user.user_id, self.videogame.videogame_id)

        user_role_profile = user_game_profile.get_role_profile_by_role(slot.game_role)
        if not user_role_profile:
            raise InvalidRoleProfileException(slot.game_role.role_id, user_game_profile.game_profile_id)

        # Si el equipo restringe la región, el jugador debe tener una región definida y coincidir
        if not self.allow_other_regions and self.region is not None:
            player_region = user_game_profile.region
            if player_region is None or player_region.region_id != self.region.region_id:
                raise InvalidRegionException(self.region.region_id,
                                             player_region.region_id if player_region else None, self.team_id)

        if user_role_profile.rank.value < self.min_rank.value or user_role_profile.rank.value > self.max_rank.value:
            raise InvalidrankException(self.team_id, user_role_profile.rank.rank_id, user_role_profile.rank.value,
                                       self.min_rank.value, self.max_rank.value)

    def get_join_rejection(self, user: 'User') -> Optional[DomainException]:
        """
        Indica por qué el usuario no podría unirse al equipo (None si puede unirse a al menos una vacante).
        No contempla si el usuario ya está en otro equipo activo, eso requiere consultar el repositorio.
        """
        if not self.is_active:
            return TeamNotActiveException(self.team_id)
        if self.is_full():
            return TeamIsAlreadyFullException(self.team_id)
        if self.has_member(user.user_id):
            return UserAlreadyInTeamException(user.user_id, self.team_id)

        first_rejection: Optional[DomainException] = None
        for slot in self.vacant_slots():
            try:
                self._validate_user_for_slot(user, slot)
                return None
            except DomainException as err:
                first_rejection = first_rejection or err
        return first_rejection

    def add_member(self, new_user: 'User', target_team_member_slot_id: int) -> None:
        if not self.is_active:
            raise TeamNotActiveException(self.team_id)

        # Validar que el equipo no esté lleno
        if self.is_full():
            raise TeamIsAlreadyFullException(self.team_id)

        # Validar que el jugador no sea ya miembro del equipo
        if self.has_member(new_user.user_id):
            raise UserAlreadyInTeamException(new_user.user_id, self.team_id)

        target_slot = self.get_member_slot_by_id(target_team_member_slot_id)
        if not target_slot:
            raise TeamMemberSlotNotFoundException(target_team_member_slot_id, self.team_id)
        if target_slot.user is not None:
            raise RoleAlreadyOcupiedException(target_slot.game_role.role_id, self.team_id)

        self._validate_user_for_slot(new_user, target_slot)

        target_slot.user = new_user

        # Agregar al usuario a la conversación del equipo
        self.conversation.members.append(ConversationMember(
            conversation_member_id=None,
            conversation_id=self.conversation.conversation_id,
            user=new_user,
            role=ConversationMemberRoleEnum.MEMBER
        ))

    def update_information(
        self,
        name: str,
        description: Optional[str],
        allow_other_regions: bool,
        region: Optional['Region'],
        min_rank: 'Rank',
        max_rank: 'Rank',
    ) -> None:

        name = StaticValidationService.validate_videogame_name_format(name)

        if region is not None and region.videogame != self.videogame:
            raise CatalogItemVideogameMismatchException("región", region.region_id, self.videogame.videogame_id)

        for rank in (min_rank, max_rank):
            if rank.videogame != self.videogame:
                raise CatalogItemVideogameMismatchException("rango", rank.rank_id, self.videogame.videogame_id)

        if min_rank.value > max_rank.value:
            raise InvalidRankRangeException(min_rank.value, max_rank.value)

        if region is None and not allow_other_regions:
            raise TeamWithoutRegionMustAllowOthersException()

        # Validar compatibilidad de rangos con todos los integrantes activos actuales (incluyendo líder)
        for member in self._members:
            if member.user is not None:
                user_game_profile = member.user.get_game_profile_by_videogame(self.videogame)
                if user_game_profile:
                    user_role_profile = user_game_profile.get_role_profile_by_role(member.game_role)
                    if user_role_profile and user_role_profile.rank:
                        member_rank = user_role_profile.rank
                        if member_rank.value < min_rank.value or member_rank.value > max_rank.value:
                            team_id = self.team_id
                            raise InvalidrankException(
                                team_id,
                                member_rank.rank_id,
                                member_rank.value,
                                min_rank.value,
                                max_rank.value
                            )

        self._name = name.strip()
        self._description = description
        self._allow_other_regions = bool(allow_other_regions)
        self._region = region
        self._min_rank = min_rank
        self._max_rank = max_rank
        if self._conversation:
            self._conversation.name = f"Chat del equipo {self._name}"

    def leave_team(self, user_id: int) -> None:
        """Permite a un miembro regular abandonar el equipo, liberando su cupo y revocando su acceso al chatroom."""
        if not self.is_active:
            raise TeamNotActiveException(self.team_id)

        if self.is_leader(user_id):
            raise LeaderCannotLeaveTeamException(self.team_id)

        self._remove_member(user_id)

    def kick_member(self, requester_id: int, target_user_id: int) -> None:
        """Permite al líder expulsar a un integrante activo del equipo, liberando su cupo y revocando su acceso al chatroom."""
        if not self.is_active:
            raise TeamNotActiveException(self.team_id)

        if not self.is_leader(requester_id):
            raise UserNotTeamLeaderException(requester_id, self.team_id)

        if requester_id == target_user_id:
            raise LeaderCannotKickSelfException(self.team_id)

        self._remove_member(target_user_id)


    def _remove_member(self, target_user_id: int) -> None:
        """Mét.odo interno para remover a un miembro del equipo sin validaciones de permisos."""
        target_slot = None
        for member in self._members:
            if member.user is not None and member.user.user_id == target_user_id:
                target_slot = member
                break

        if not target_slot:
            raise UserNotInTeamException(target_user_id, self.team_id)

        # Liberar el cupo
        target_slot.user = None

        # Remover de la conversación del equipo
        if self._conversation:
            self._conversation.members = [
                member for member in self._conversation.members
                if member.user is not None and member.user.user_id != target_user_id
            ]
