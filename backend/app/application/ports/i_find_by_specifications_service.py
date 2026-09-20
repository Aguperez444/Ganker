from abc import ABC, abstractmethod

from app.domain.models.game_profile import GameProfile
from app.domain.specifications.base import Specification


class IFindBySpecificationRepository(ABC):

    @abstractmethod
    def get_videogame_profiles(self, spec: Specification, skip: int, limit: int) -> list['GameProfile']:
        pass