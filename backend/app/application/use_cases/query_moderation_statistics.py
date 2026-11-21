from datetime import datetime, timezone

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.domain_exception import DomainException
from app.infrastructure.api.dto.response.moderation_statistics_response import ModerationStatisticsResponse


def in_utc(value):
    if value is None:
        return None
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


class QueryModerationStatistics:
    def __init__(self, uow: IUnitOfWork):
        self.uow = uow

    def execute(self, start_date=None, end_date=None, ranking_limit=10):
        now = datetime.now(timezone.utc)
        start, end = in_utc(start_date), in_utc(end_date) or now
        if start is not None and start >= end:
            raise DomainException("La fecha inicial debe ser anterior a la final.", status_code=422)
        with self.uow as uow:
            data = uow.moderation_statistics_repo.query(start, end if end_date is not None else None, now, ranking_limit)
            return ModerationStatisticsResponse(generated_at=now, start_date=start, end_date=end, ranking_limit=ranking_limit, **data)
