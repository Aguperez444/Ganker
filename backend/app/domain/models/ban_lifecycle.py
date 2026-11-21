from datetime import datetime, timezone
from enum import Enum


class BanEndReason(str, Enum):
    EXPIRED = "expired"
    MANUAL = "manual"
    APPEAL = "appeal"
    SUPERSEDED = "superseded"
    UNKNOWN = "unknown"


def utc_datetime(value):
    return value.replace(tzinfo=timezone.utc) if value is not None and value.tzinfo is None else value


def describe_ban_lifecycle(record, is_current):
    reason = record.end_reason
    if reason in (BanEndReason.MANUAL, BanEndReason.APPEAL):
        return "unbanned", record.ended_at, reason
    if reason == BanEndReason.SUPERSEDED:
        return "superseded", record.ended_at, reason
    if reason == BanEndReason.UNKNOWN:
        return "unknown", record.ended_at, reason
    if reason == BanEndReason.EXPIRED or (
        record.expires_at is not None and utc_datetime(record.expires_at) <= datetime.now(timezone.utc)
    ):
        return "expired", record.ended_at or record.expires_at, BanEndReason.EXPIRED
    if is_current and record.banned_user.banned and record.ended_at is None:
        return "active", None, None
    return "unknown", record.ended_at, BanEndReason.UNKNOWN
