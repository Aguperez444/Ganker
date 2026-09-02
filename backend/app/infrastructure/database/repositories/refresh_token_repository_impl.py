import datetime

from sqlalchemy.orm import Session

from app.application.ports.i_refresh_token_repository import IRefreshTokenRepository
from app.infrastructure.database.models.refresh_token_orm import RefreshTokenORM


class RefreshTokenRepositoryImpl(IRefreshTokenRepository):
    def __init__(self, session: Session):
        self.session: Session = session

    def save(self, user_id: int, role: str, jti: str, expires_at: datetime.datetime) -> None:
        token_record = RefreshTokenORM(
            user_id=user_id,
            user_role=role,
            jti=jti,
            expires_at=expires_at,
            revoked=False
        )
        self.session.add(token_record)
        self.session.flush()

    def revoke_by_jti(self, jti: str) -> bool:
        token_record = (
            self.session.query(RefreshTokenORM)
            .filter(RefreshTokenORM.jti == jti, RefreshTokenORM.revoked == False)
            .first()
        )
        if not token_record:
            return False

        token_record.revoked = True
        self.session.flush()
        return True

    def is_valid(self, jti: str) -> bool:
        now = datetime.datetime.now(datetime.timezone.utc)
        token_record = (
            self.session.query(RefreshTokenORM)
            .filter(
                RefreshTokenORM.jti == jti,
                RefreshTokenORM.revoked == False,
                RefreshTokenORM.expires_at > now
            )
            .first()
        )
        return token_record is not None