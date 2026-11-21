from app.domain.models.user_ban_record import UserBanRecord
from app.infrastructure.database.mappers.user_mapper import UserMapper
from app.infrastructure.database.models import UserBanRecordORM


class UserBanRecordMapper:
    @staticmethod
    def orm_to_domain(user_ban_record_orm: UserBanRecordORM) -> UserBanRecord:
        return UserBanRecord(
            user_ban_record_id=user_ban_record_orm.id,
            banned_user=UserMapper.orm_to_domain(user_ban_record_orm.banned_user),
            banned_by_user=UserMapper.orm_to_domain(user_ban_record_orm.banned_by_user),
            reason=user_ban_record_orm.reason,
            created_at=user_ban_record_orm.created_at,
            expires_at=user_ban_record_orm.expires_at,
            ended_at=user_ban_record_orm.ended_at,
            ended_by_user=UserMapper.orm_to_domain(user_ban_record_orm.ended_by_user) if user_ban_record_orm.ended_by_user else None,
            end_reason=user_ban_record_orm.end_reason,
        )

    @staticmethod
    def domain_to_orm(user_ban_record: UserBanRecord) -> UserBanRecordORM:
        if not user_ban_record.is_persisted():
            return UserBanRecordORM(
                banned_user_id=user_ban_record.banned_user.user_id,
                banned_by_user_id=user_ban_record.banned_by_user.user_id,
                reason=user_ban_record.reason,
                created_at=user_ban_record.created_at,
                expires_at=user_ban_record.expires_at,
                ended_at=user_ban_record.ended_at,
                ended_by_user_id=user_ban_record.ended_by_user.user_id if user_ban_record.ended_by_user else None,
                end_reason=user_ban_record.end_reason,
            )
        return UserBanRecordORM(
            id=user_ban_record.user_ban_record_id,
            banned_user_id=user_ban_record.banned_user.user_id,
            banned_by_user_id=user_ban_record.banned_by_user.user_id,
            reason=user_ban_record.reason,
            created_at=user_ban_record.created_at,
            expires_at=user_ban_record.expires_at,
            ended_at=user_ban_record.ended_at,
            ended_by_user_id=user_ban_record.ended_by_user.user_id if user_ban_record.ended_by_user else None,
            end_reason=user_ban_record.end_reason,
        )
