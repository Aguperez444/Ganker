from typing import Optional, TYPE_CHECKING

from app.domain.exceptions.entity_not_persisted_exception import EntityNotPersistedException
from app.domain.exceptions.invalid_id_exception import InvalidIdException

if TYPE_CHECKING:
    from app.domain.models.user import User
    from app.domain.models.team_role_enum import TeamRoleEnum
    from app.domain.models.role import Role


class TeamMemberRole:
    def __init__(self, team_member_role_id: Optional[int], team_role: 'TeamRoleEnum',
                 team_id: int, user: Optional['User'], game_role: 'Role'):
        self._team_member_role_id = team_member_role_id
        self._team_role = team_role
        self._game_role = game_role
        self._team_id = team_id
        self._user = user

    @property
    def team_member_role_id(self) -> int:
        if self._team_member_role_id is None:
            raise EntityNotPersistedException("TeamMemberRole")
        return self._team_member_role_id
    @team_member_role_id.setter
    def team_member_role_id(self, value: int):
        if isinstance(value, bool) or not isinstance(value, int):
            raise InvalidIdException(value)
        self._team_member_role_id = value

    @property
    def team_role(self) -> 'TeamRoleEnum':
        return self._team_role
    @team_role.setter
    def team_role(self, value: 'TeamRoleEnum'):
        self._team_role = value

    @property
    def game_role(self) -> 'Role':
        return self._game_role
    @game_role.setter
    def game_role(self, value: 'Role'):
        self._game_role = value

    @property
    def team_id(self) -> int:
        return self._team_id
    @team_id.setter
    def team_id(self, value: int):
        if isinstance(value, bool) or not isinstance(value, int):
            raise InvalidIdException(value)
        self._team_id = value

    @property
    def user(self) -> Optional['User']:
        return self._user
    @user.setter
    def user(self, value: Optional['User']):
        self._user = value

    def __eq__(self, other: object) -> bool:
        if isinstance(other, TeamMemberRole):
            return self._team_member_role_id is not None and self._team_member_role_id == other._team_member_role_id
        return False

    def is_persisted(self) -> bool:
        return self._team_member_role_id is not None

    def __repr__(self) -> str:
        return f"TeamMemberRole(team_member_role_id={self.team_member_role_id if self.is_persisted() else 'sin_id'}, role={self.team_role}, team_id={self.team_id}, user={self.user}, game_role={self.game_role})"
