from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from threading import Barrier
from unittest.mock import MagicMock

from app.application.use_cases.create_ban_appeal import CreateBanAppeal
from app.application.use_cases.resolve_ban_appeal import ResolveBanAppeal
from app.domain.exceptions.domain_exception import DomainException
from app.domain.models.ban_appeal import BanAppealStatus
from app.infrastructure.database.models.ban_appeal_orm import BanAppealORM
from app.infrastructure.database.models.user_ban_record_orm import UserBanRecordORM
from app.infrastructure.database.models.user_orm import UserORM
from app.infrastructure.database.unit_of_work.unit_of_work_impl import SqlAlchemyUnitOfWork


def test_concurrent_appeals_and_opposite_decisions_are_serialized(postgres_sessions):
    with postgres_sessions() as session:
        player = UserORM(username="appealing", name="Appealing", role="player", banned=True)
        admin = UserORM(username="reviewer", name="Reviewer", role="admin")
        session.add_all([player, admin])
        session.flush()
        ban = UserBanRecordORM(banned_user_id=player.user_id, banned_by_user_id=admin.user_id, reason="Scripts", expires_at=datetime.now(timezone.utc) + timedelta(days=7))
        session.add(ban)
        session.commit()
        player_id, admin_id, ban_id = player.user_id, admin.user_id, ban.id

    barrier = Barrier(2)
    def submit():
        barrier.wait(timeout=10)
        try:
            return CreateBanAppeal(SqlAlchemyUnitOfWork(postgres_sessions), MagicMock()).execute(player_id, ban_id, "Appeal").appeal_id
        except DomainException as error:
            return error.status_code

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda _: submit(), range(2)))
    assert results.count(409) == 1
    with postgres_sessions() as session:
        assert session.query(BanAppealORM).count() == 1
        appeal_id = session.query(BanAppealORM).one().id

    barrier = Barrier(2)
    def resolve(decision):
        barrier.wait(timeout=10)
        try:
            return ResolveBanAppeal(SqlAlchemyUnitOfWork(postgres_sessions)).execute(appeal_id, admin_id, decision).status.value
        except DomainException as error:
            return error.status_code

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(resolve, [BanAppealStatus.ACCEPTED, BanAppealStatus.REJECTED]))
    assert results.count(409) == 1
    with postgres_sessions() as session:
        status = session.get(BanAppealORM, appeal_id).status
        assert session.get(UserORM, player_id).banned is (status == "rejected")
