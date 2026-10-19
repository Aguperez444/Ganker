from abc import ABC, abstractmethod

from app.domain.models.team import Team
from app.domain.specifications.base import Specification
from app.infrastructure.api.dto.response.get.get_game_profile_response import GetGameProfileResponse
from app.infrastructure.database.models.player_report_orm import PlayerReportORM
from app.infrastructure.database.models.users_banned import UsersBanned


class IFindBySpecificationsRepository(ABC):



    @abstractmethod
    def get_videogame_profiles(self, spec: Specification, skip: int, limit: int) -> list['GetGameProfileResponse']:
        raise NotImplementedError

    @abstractmethod
    def get_teams(self, spec: Specification, skip: int, limit: int) -> list['Team']:
        raise NotImplementedError

    @abstractmethod
    def get_banned_players(self, spec: Specification | None, skip: int, limit: int) -> list['UsersBanned']:
        raise NotImplementedError

    @abstractmethod
    def get_reports_players(self, spec: Specification | None, skip: int, limit: int) -> list['PlayerReportORM']:
        raise NotImplementedError