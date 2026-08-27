from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.domain.models.role import Role

class IRoleRepository(ABC):

    @abstractmethod
    def get_role_by_id(self, role_id: int) -> Optional['Role']:
        raise NotImplementedError