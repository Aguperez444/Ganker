import time
from datetime import datetime, timedelta, timezone

import pytest

from app.domain.exceptions.moderation.ban_not_finished_exception import BanNotFinishedException
from app.infrastructure.database.models.user_ban_record_orm import UserBanRecordORM
from app.infrastructure.database.repositories.moderation_repository_impl import ModerationRepositoryImpl


@pytest.mark.parametrize("local_timezone", ["America/Argentina/Cordoba", "Asia/Tokyo"])
@pytest.mark.parametrize("expired", [True, False])
def test_sqlite_ban_expiration_is_compared_in_utc(
    test_db_session, seed_player, monkeypatch, local_timezone, expired,
):
    seed_player.banned = True
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=-1 if expired else 1)
    test_db_session.add(UserBanRecordORM(
        banned_user_id=seed_player.user_id, reason="Abuso", expires_at=expires_at,
    ))
    test_db_session.commit()
    # SQLite devuelve expires_at sin zona horaria al volver a leerlo.
    test_db_session.expire_all()
    try:
        with monkeypatch.context() as patch:
            patch.setenv("TZ", local_timezone)
            time.tzset()
            repo = ModerationRepositoryImpl(test_db_session)
            if expired:
                repo.unban_user_if_applicable(seed_player.user_id)
                assert seed_player.banned is False
            else:
                with pytest.raises(BanNotFinishedException):
                    repo.unban_user_if_applicable(seed_player.user_id)
                assert seed_player.banned is True
    finally:
        time.tzset()
