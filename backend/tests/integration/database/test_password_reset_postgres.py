import hashlib
from datetime import datetime, timedelta, timezone

from app.application.use_cases.forgot_password import ForgotPassword
from app.application.use_cases.reset_password import ResetPassword
from app.infrastructure.database.models import UserORM
from app.infrastructure.database.models.password_reset_token_orm import PasswordResetTokenORM
from app.infrastructure.database.unit_of_work.unit_of_work_impl import SqlAlchemyUnitOfWork


def test_password_reset_persists_timestamps_and_changes_password(postgres_sessions, password_hasher):
    mail = "reset@example.com"
    with postgres_sessions.begin() as session:
        user = UserORM(
            name="Reset Player", username="resetplayer", mail=mail, role="player",
            password_hash=password_hasher.hash_password("OldPassword123"),
        )
        session.add(user)
        session.flush()
        user_id = user.user_id

    before = datetime.now(timezone.utc)
    raw_token = ForgotPassword(SqlAlchemyUnitOfWork(postgres_sessions)).execute(mail)
    after = datetime.now(timezone.utc)
    assert raw_token is not None
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    with postgres_sessions() as session:
        token = session.query(PasswordResetTokenORM).filter_by(token_hash=token_hash).one()
        assert token.user_id == user_id
        assert token.is_used is False
        assert before <= token.create_at <= after
        assert before + timedelta(minutes=15) <= token.expires_at <= after + timedelta(minutes=15)

    ResetPassword(password_hasher, SqlAlchemyUnitOfWork(postgres_sessions)).execute(
        raw_token, "NewPassword123",
    )

    with postgres_sessions() as session:
        user = session.get(UserORM, user_id)
        assert password_hasher.verify_password("NewPassword123", user.password_hash)
        token = session.query(PasswordResetTokenORM).filter_by(token_hash=token_hash).one()
        assert token.is_used is True
