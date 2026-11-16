from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload, selectinload

from app.application.ports.i_ban_appeal_repository import IBanAppealRepository
from app.domain.exceptions.domain_exception import DomainException
from app.domain.models.ban_appeal import AppealableBan, BanAppeal, BanAppealStatus
from app.infrastructure.database.models.ban_appeal_orm import BanAppealORM, BanAppealImageORM
from app.infrastructure.database.models.user_ban_record_orm import UserBanRecordORM
from app.infrastructure.database.models.user_orm import UserORM


class BanAppealRepositoryImpl(IBanAppealRepository):
    def __init__(self, session):
        self.session = session

    def get_ban(self, user_id, ban_id, lock=False):
        query = self.session.query(UserORM).filter(UserORM.user_id == user_id, UserORM.deleted.is_(False))
        if lock:
            query = query.with_for_update().populate_existing()
        user = query.first()
        if user is None:
            return None
        ban = self.session.query(UserBanRecordORM).filter(
            UserBanRecordORM.id == ban_id, UserBanRecordORM.banned_user_id == user_id,
        ).populate_existing().first()
        if ban is None:
            return None
        latest = self.session.query(UserBanRecordORM.id).filter(
            UserBanRecordORM.banned_user_id == user_id,
        ).order_by(UserBanRecordORM.id.desc()).first()
        expires = ban.expires_at
        if expires is not None and expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        return AppealableBan(
            ban_id=ban.id, user_id=user_id, username=user.username, reason=ban.reason,
            created_at=ban.created_at, expires_at=ban.expires_at,
            active=bool(user.banned and ban.ended_at is None and latest.id == ban.id and (expires is None or expires > datetime.now(timezone.utc))),
        )

    def _query(self):
        return self.session.query(BanAppealORM).options(
            joinedload(BanAppealORM.ban), joinedload(BanAppealORM.resolver), selectinload(BanAppealORM.images),
        )

    def _to_domain(self, row):
        if row is None:
            return None
        ban = self.get_ban(row.ban.banned_user_id, row.ban_record_id)
        if ban is None:
            return None
        return BanAppeal(
            appeal_id=row.id, ban=ban, text=row.text, status=BanAppealStatus(row.status),
            created_at=row.created_at, images=[image.image_url for image in row.images],
            resolved_at=row.resolved_at, resolver_user_id=row.resolver_user_id,
            resolver_username=row.resolver.username if row.resolver else None,
        )

    def get_by_ban(self, ban_id):
        return self._to_domain(self._query().filter(BanAppealORM.ban_record_id == ban_id).first())

    def get_by_id(self, appeal_id, lock=False):
        row = self._query().filter(BanAppealORM.id == appeal_id).first()
        if row is None:
            return None
        if lock:
            # Todas las decisiones para un jugador se serializan sobre su fila.
            self.get_ban(row.ban.banned_user_id, row.ban_record_id, lock=True)
            row = self._query().filter(BanAppealORM.id == appeal_id).populate_existing().first()
        return self._to_domain(row)

    def save(self, appeal):
        if appeal.appeal_id is None:
            row = BanAppealORM(
                ban_record_id=appeal.ban.ban_id, text=appeal.text, status=appeal.status.value,
                created_at=appeal.created_at,
                images=[BanAppealImageORM(image_url=url, position=index) for index, url in enumerate(appeal.images)],
            )
            self.session.add(row)
        else:
            row = self.session.get(BanAppealORM, appeal.appeal_id)
            row.status = appeal.status.value
            row.resolved_at = appeal.resolved_at
            row.resolver_user_id = appeal.resolver_user_id
        try:
            self.session.flush()
        except IntegrityError as exc:
            raise DomainException("Ya presentaste una apelación para este baneo.", status_code=409) from exc
        return self._to_domain(self._query().filter(BanAppealORM.id == row.id).populate_existing().one())

    def search(self, username, status, skip, limit):
        query = self._query().join(BanAppealORM.ban).join(
            UserORM, UserORM.user_id == UserBanRecordORM.banned_user_id,
        ).filter(UserORM.deleted.is_(False))
        if username:
            query = query.filter(UserORM.username.icontains(username, autoescape=True))
        if status:
            query = query.filter(BanAppealORM.status == status)
        rows = query.order_by(BanAppealORM.created_at.desc(), BanAppealORM.id.desc()).offset(skip).limit(limit).all()
        return [self._to_domain(row) for row in rows]
