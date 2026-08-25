
from typing import TYPE_CHECKING, Optional

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
    def role_profile_id(self) -> Optional[int]:
        return self._role_profile_id
    @role_profile_id.setter
    def role_profile_id(self, value: Optional[int]) -> None:
        self._role_profile_id = value