from datetime import datetime

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.specifications.base import Specification
from app.domain.specifications.reports_players.create_at_specification import ByCreateAtSpecification
from app.domain.specifications.reports_players.reason_specification import ByReasonsSpecification
from app.domain.specifications.reports_players.reported_by_specification import ByReportedBySpecification
from app.domain.specifications.reports_players.reported_user_specification import ByReportedUserSpecification
from app.domain.specifications.reports_players.resolved_at_specification import ByResolvedAtSpecification
from app.domain.specifications.reports_players.resolved_by_specification import ByResolvedBySpecification
from app.domain.specifications.reports_players.status_specification import ByStatusSpecification
from app.infrastructure.api.dto.response.search_reported_players_response import SearchReportedPlayersResponse


class SearchReportsPlayers:

    def __init__(self, uow: 'IUnitOfWork'):
        self.uow = uow

    def execute(self, reported_by: str | None = None, reported_user: str | None = None,
                status: str | None = None, reason: str | None = None, resolved_by: str | None = None,
                min_create_date: datetime | None = None, max_create_date: datetime | None = None,
                min_resolve_date: datetime | None = None, max_resolve_date: datetime | None = None,
                skip: int = 0, limit: int = 10):
        with self.uow as uow:
            specs: list[Specification] = []

            if reported_by is not None:
                reported_by = reported_by.strip()
                specs.append(ByReportedBySpecification(reported_by))

            if reported_user is not None:
                reported_user = reported_user.strip()
                specs.append(ByReportedUserSpecification(reported_user))

            if status is not None:
                status = status.strip()
                specs.append(ByStatusSpecification(status))

            if reason is not None:
                reason = reason.strip()
                specs.append(ByReasonsSpecification(reason))

            if resolved_by is not None:
                resolved_by = resolved_by.strip()
                specs.append(ByResolvedBySpecification(resolved_by))

            if min_create_date is not None or max_create_date is not None:
                specs.append(ByCreateAtSpecification(min_create_date, max_create_date))

            if min_resolve_date is not None or max_resolve_date is not None:
                specs.append(ByResolvedAtSpecification(min_resolve_date, max_resolve_date))

            combined_spec = specs[0] if specs else None
            for spec in specs[1:]:
                combined_spec = combined_spec & spec

            reports_players = uow.find_by_specification_repo.get_reports_players(combined_spec, skip, limit)

            return [
                SearchReportedPlayersResponse(
                    id=report_player.id,
                    reported_name=report_player.reported.username,
                    reporter_name=report_player.reporter.username,
                    status=report_player.status,
                    reason=report_player.reason,
                    description=report_player.description,
                    created_at=report_player.created_at,
                    resolved_at=report_player.resolved_at,
                    resolved_by=report_player.resolver_user.username if report_player.resolver_user is not None else None,
                ) for report_player in reports_players
            ]