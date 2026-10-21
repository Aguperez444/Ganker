from abc import ABC, abstractmethod

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.domain.models.team import Team
    from app.domain.specifications.base import Specification
    from app.domain.models.user_ban_record import UserBanRecord
    from app.infrastructure.api.dto.response.get.get_game_profile_response import GetGameProfileResponse
    from app.domain.models.player_report import PlayerReport


class IFindBySpecificationsRepository(ABC):



    @abstractmethod
    def get_videogame_profiles(self, spec: 'Specification', skip: int, limit: int) -> list['GetGameProfileResponse']:
        raise NotImplementedError

    @abstractmethod
    def get_teams(self, spec: 'Specification', skip: int, limit: int) -> list['Team']:
        raise NotImplementedError

    @abstractmethod
    def get_banned_players(self, spec: 'Specification | None', skip: int, limit: int) -> list['UserBanRecord']:
        raise NotImplementedError

    @abstractmethod
    def get_reports_players(self, spec: 'Specification | None', skip: int, limit: int) -> list['PlayerReport']:
        raise NotImplementedError