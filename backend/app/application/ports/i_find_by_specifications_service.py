from abc import ABC, abstractmethod

from app.domain.specifications.base import Specification
from app.infrastructure.api.dto.response.get_game_profile_response import GetGameProfileResponse


class IFindBySpecificationRepository(ABC):

    @abstractmethod
    def get_videogame_profiles(self, spec: Specification, skip: int, limit: int) -> list['GetGameProfileResponse']:
        pass