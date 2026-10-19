from datetime import datetime
from typing import Optional, List

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.models.user import User
from app.domain.specifications.banned_players.banned_by_specification import ByBannedBySpecification
from app.domain.specifications.banned_players.banned_user_specfication import ByBannedUsersSpecification
from app.domain.specifications.banned_players.create_at_specification import ByCreateAtSpecification
from app.domain.specifications.banned_players.expires_at_specification import ByExpiresAtSpecification
from app.domain.specifications.banned_players.reason_specification import ByReasonSpecification
from app.domain.specifications.base import Specification
from app.infrastructure.api.dto.response.search_banned_players_response import SearchBannedPlayersResponse


class SearchBannedPlayers:
    def __init__(self, uow: 'IUnitOfWork'):
        self.uow = uow

    def execute(self, banned_by: Optional[str] = None, banned_user: Optional[str] = None,
                min_date_create: Optional[datetime] = None, max_date_create: Optional[datetime] = None,
                min_date_expire: Optional[datetime] = None, max_date_expire: Optional[datetime] = None,
                reason: Optional[str] = None, skip: int = 0, limit: int = 10
                ):

        with self.uow as uow:

            specs: list['Specification'] = []

            if banned_by is not None:
                banned_by = banned_by.strip()
                specs.append(ByBannedBySpecification(banned_by))

            if banned_user is not None:
                banned_user = banned_user.strip()
                specs.append(ByBannedUsersSpecification(banned_user))

            if min_date_create is not None or max_date_create is not None:
                specs.append(ByCreateAtSpecification(min_date_create, max_date_create))

            if min_date_expire is not None or max_date_expire is not None:
                specs.append(ByExpiresAtSpecification(min_date_expire, max_date_expire))

            if reason is not None:
                reason = reason.strip()
                specs.append(ByReasonSpecification(reason))

            combined_spec = specs[0] if specs else None
            for spec in specs[1:]:
                combined_spec = combined_spec & spec

            banned_players = uow.find_by_specification_repo.get_banned_players(combined_spec, skip, limit)

            return [
                SearchBannedPlayersResponse(
                    id=banned_player.id,
                    banned_by=banned_player.moderator_banned_player.username,
                    banned_user=banned_player.banned_player.username,
                    date_create=banned_player.create_at,
                    date_expire=banned_player.expires_at,
                    reason=banned_player.reason
                ) for banned_player in banned_players
            ]