from datetime import datetime

from pydantic import BaseModel

from app.domain.models.ban_lifecycle import BanEndReason, describe_ban_lifecycle
from app.infrastructure.api.dto.response.ban_appeal_response import BanAppealResponse


class BanRecordResponse(BaseModel):
    id: int
    user_id: int
    username: str
    banned_by_user_id: int | None
    banned_by_username: str | None
    reason: str
    created_at: datetime
    expires_at: datetime | None
    ended_at: datetime | None
    ended_by_user_id: int | None
    ended_by_username: str | None
    end_reason: BanEndReason | None
    status: str
    is_current: bool

    @classmethod
    def from_record(cls, record, is_current):
        status, ended_at, end_reason = describe_ban_lifecycle(record, is_current)
        return cls(
            id=record.user_ban_record_id, user_id=record.banned_user.user_id,
            username=record.banned_user.username,
            banned_by_user_id=record.banned_by_user.user_id if record.banned_by_user else None,
            banned_by_username=record.banned_by_user.username if record.banned_by_user else None,
            reason=record.reason, created_at=record.created_at, expires_at=record.expires_at,
            ended_at=ended_at, end_reason=end_reason,
            ended_by_user_id=record.ended_by_user.user_id if record.ended_by_user else None,
            ended_by_username=record.ended_by_user.username if record.ended_by_user else None,
            status=status, is_current=is_current,
        )


class BanRecordDetailResponse(BanRecordResponse):
    appeal: BanAppealResponse | None = None


class PlayerBanHistoryResponse(BaseModel):
    bans: list[BanRecordResponse]
