from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class BanAppealStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


@dataclass
class AppealableBan:
    ban_id: int
    user_id: int
    username: str
    reason: str
    created_at: datetime
    expires_at: datetime | None
    active: bool


@dataclass
class BanAppeal:
    appeal_id: int | None
    ban: AppealableBan
    text: str
    status: BanAppealStatus
    created_at: datetime
    images: list[str] = field(default_factory=list)
    resolved_at: datetime | None = None
    resolver_user_id: int | None = None
    resolver_username: str | None = None
