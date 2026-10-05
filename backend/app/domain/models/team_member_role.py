from typing import Optional, TYPE_CHECKING

from app.domain.exceptions.entity_not_persisted_exception import EntityNotPersistedException
from app.domain.exceptions.invalid_id_exception import InvalidIdException

if TYPE_CHECKING:
    from app.domain.models.team import Team
    from app.domain.models.user import User


class TeamMemberRole:
    def __init__(self, team_member_role_id: Optional[int], role: int, team_id: int, user: 'User'):
        self._team_member_role_id = team_member_role_id
        self._role = role
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
    def role(self) -> int:
        return self._role
    @role.setter
    def role(self, value: int):
        if isinstance(value, bool) or not isinstance(value, int):
            raise InvalidIdException(value)
        self._role = value

    @property
    def team_id(self) -> int:
        return self._team_id
    @team_id.setter
    def team_id(self, value: int):
        if isinstance(value, bool) or not isinstance(value, int):
            raise InvalidIdException(value)
        self._team_id = value

    @property
    def user(self) -> 'User':
        return self._user
    @user.setter
    def user(self, value: 'User'):
        self._user = value

    def __eq__(self, other: object) -> bool:
        if isinstance(other, TeamMemberRole):
            return self._team_member_role_id is not None and self._team_member_role_id == other._team_member_role_id
        return False

    def is_persisted(self) -> bool:
        return self._team_member_role_id is not None

    def __repr__(self) -> str:
        return f"TeamMemberRole(team_member_role_id={self.team_member_role_id if self.is_persisted() else 'sin_id'}, role={self.role}, team_id={self.team_id}, user={self.user})"
