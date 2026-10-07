
from typing import TYPE_CHECKING, Optional

from app.domain.exceptions.entity_not_persited_exception import EntityNotPersistedException
from app.domain.exceptions.invalid_id_exception import InvalidIdException

if TYPE_CHECKING:
    from app.domain.models.rank import Rank
    from app.domain.models.role import Role


class RoleProfile:
    def __init__(self, role_profile_id: Optional[int], role: Role, rank: Rank):
        self._role_profile_id: Optional[int] = role_profile_id
        self._role: Role = role
        self._rank: Rank= rank

    @property
    def role(self) -> Role:
        return self._role
    @role.setter
    def role(self, value: Role) -> None:
        self._role = value

    @property
    def rank(self) -> Rank:
        return self._rank
    @rank.setter
    def rank(self, value: Rank) -> None:
        self._rank = value

    @property
    def role_profile_id(self) -> int:
        if self._role_profile_id is None:
            raise EntityNotPersistedException("RoleProfile")
        return self._role_profile_id
    @role_profile_id.setter
    def role_profile_id(self, value: Optional[int]) -> None:
        if isinstance(value, bool) or not isinstance(value, int):
            raise InvalidIdException(value)
        self._role_profile_id = value

    def is_persisted(self) -> bool:
        return self._role_profile_id is not None

    def __repr__(self) -> str:
        return (f"RoleProfile(role_profile_id={self.role_profile_id or 'sin_id'},"
                f" role={self.role}, rank={self.rank})")